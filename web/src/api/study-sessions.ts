import type { AuthSession } from '@/auth/types'
import { createSessionRequest } from './session-request'
import type { DisciplinaEstudo, SessaoEstudo, SessaoEstudoInput } from '@/study-sessions/type'

const caminho = '/sessoes-estudo/'

function payload(input: SessaoEstudoInput) {
  return {
    disciplina_id: input.disciplina.id,
    data: input.data,
    inicio: input.inicio,
    termino: input.termino,
    observacao: input.observacao,
  }
}

export function criarApiSessoesEstudo(session: AuthSession) {
  const request = createSessionRequest(session)
  return {
    async listarDisciplinas(): Promise<DisciplinaEstudo[]> {
      const disciplinas = await request<(DisciplinaEstudo & { ativo: boolean })[]>('get', '/disciplinas/')
      return disciplinas.filter(item => item.ativo)
    },
    listar: () => request<SessaoEstudo[]>('get', caminho),
    criar: (input: SessaoEstudoInput) => request<SessaoEstudo>('post', caminho, payload(input)),
    editar: (id: string, input: SessaoEstudoInput) => request<SessaoEstudo>('put', `${caminho}${encodeURIComponent(id)}`, payload(input)),
    async excluir(id: string): Promise<void> {
      await request('delete', `${caminho}${encodeURIComponent(id)}`)
    },
  }
}
