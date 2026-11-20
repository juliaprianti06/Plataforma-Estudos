import type { AuthSession } from '@/auth/types'
import { createSessionRequest } from './session-request'
import { criarSessoesDemonstracao, disciplinasDemonstracao } from '@/data/study-sessions'
import { calcularDuracao } from '@/lib/study-sessions'
import type { DisciplinaEstudo, SessaoEstudo, SessaoEstudoInput } from '@/study-sessions/type'

// Armazenamento temporário por usuário. Trocar estas operações por HTTP quando houver endpoints.
const dados = new Map<string, SessaoEstudo[]>()
const copiar = (sessao: SessaoEstudo): SessaoEstudo => ({ ...sessao, disciplina: { ...sessao.disciplina } })

export function criarApiSessoesEstudo(session: AuthSession) {
  const chave = `${session.mode}:${session.user.id}`
  const request = createSessionRequest(session)
  const lista = () => dados.get(chave) ?? []
  function preparar(input: SessaoEstudoInput) {
    const duracaoMinutos = calcularDuracao(input.inicio, input.termino)
    if (!input.disciplina.nome || !input.data || duracaoMinutos <= 0) throw new Error('Confira os campos da sessão.')
    return { ...input, disciplina: { ...input.disciplina }, observacao: input.observacao.trim(), duracaoMinutos }
  }
  return {
    async listarDisciplinas(): Promise<DisciplinaEstudo[]> {
      if (session.mode === 'mock') return disciplinasDemonstracao.map(item => ({ ...item }))
      const disciplinas = await request<(DisciplinaEstudo & { ativo: boolean })[]>('get', '/disciplinas/')
      return disciplinas.filter(item => item.ativo)
    },
    async listar(disciplinas: DisciplinaEstudo[]): Promise<SessaoEstudo[]> {
      if (!dados.has(chave)) dados.set(chave, criarSessoesDemonstracao(disciplinas, new Date()))
      return lista().map(copiar)
    },
    async criar(input: SessaoEstudoInput): Promise<SessaoEstudo> {
      const sessao = { ...preparar(input), id: crypto.randomUUID() }
      dados.set(chave, [...lista(), sessao])
      return copiar(sessao)
    },
    async editar(id: string, input: SessaoEstudoInput): Promise<SessaoEstudo> {
      if (!lista().some(item => item.id === id)) throw new Error('Sessão não encontrada.')
      const sessao = { ...preparar(input), id }
      dados.set(chave, lista().map(item => item.id === id ? sessao : item))
      return copiar(sessao)
    },
    async excluir(id: string): Promise<void> {
      dados.set(chave, lista().filter(item => item.id !== id))
    },
  }
}
