import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/api/client'
import { sessionStore } from '@/auth/session'
import { criarApiSessoesEstudo } from '@/api/study-sessions'
import type { AuthSession } from '@/auth/types'
import type { SessaoEstudo, SessaoEstudoInput } from '@/study-sessions/type'

vi.mock('@/api/client', () => ({ api: { request: vi.fn() } }))
const session: AuthSession = { user: { id: '1', name: 'Estudante', email: 'teste@example.com' }, mode: 'api', sessionKey: 'token', expiresAt: Date.now() + 3600000 }
const input: SessaoEstudoInput = { disciplina: { id: 7, nome: 'Java', cor: 'bg-success' }, data: '2026-11-21', inicio: '14:00', termino: '15:30', observacao: 'Revisão' }
const resposta: SessaoEstudo = { ...input, id: '00000000-0000-0000-0000-000000000007', duracaoMinutos: 90 }

beforeEach(() => { vi.resetAllMocks(); sessionStore.save(session) })
afterEach(() => { sessionStore.clear() })

test('consulta, cria, edita e exclui pelo HTTP sem enviar duração ou usuário controlados pelo cliente', async () => {
  const repository = criarApiSessoesEstudo(session)
  vi.mocked(api.request).mockResolvedValueOnce({ data: [{ ...input.disciplina, ativo: true }, { id: 8, nome: 'Arquivada', ativo: false }] })
  expect(await repository.listarDisciplinas()).toEqual([{ ...input.disciplina, ativo: true }])
  vi.mocked(api.request).mockResolvedValueOnce({ data: [resposta] })
  expect(await repository.listar()).toEqual([resposta])
  vi.mocked(api.request).mockResolvedValueOnce({ data: resposta })
  expect(await repository.criar(input)).toBe(resposta)
  vi.mocked(api.request).mockResolvedValueOnce({ data: resposta })
  expect(await repository.editar(resposta.id, input)).toBe(resposta)
  vi.mocked(api.request).mockResolvedValueOnce({ data: undefined })
  await repository.excluir(resposta.id)
  const chamadas = vi.mocked(api.request).mock.calls.map(([config]) => config)
  expect(chamadas.map(config => [config.method, config.url])).toEqual([
    ['get', '/disciplinas/'], ['get', '/sessoes-estudo/'], ['post', '/sessoes-estudo/'],
    ['put', `/sessoes-estudo/${resposta.id}`], ['delete', `/sessoes-estudo/${resposta.id}`],
  ])
  expect(chamadas[2].data).toEqual({ disciplina_id: 7, data: input.data, inicio: '14:00', termino: '15:30', observacao: 'Revisão' })
  expect(chamadas[3].data).toEqual(chamadas[2].data)
  expect(chamadas.every(config => config.signal instanceof AbortSignal)).toBe(true)
})

test('propaga falhas de rede e não retorna registros locais como fallback', async () => {
  vi.mocked(api.request).mockRejectedValue(new Error('offline'))
  const repository = criarApiSessoesEstudo(session)
  await expect(repository.listar()).rejects.toThrow('offline')
  await expect(repository.criar(input)).rejects.toThrow('offline')
  expect(api.request).toHaveBeenCalledTimes(2)
})

test('impede consultas e alterações quando a conta muda', async () => {
  const repository = criarApiSessoesEstudo(session)
  sessionStore.save({ ...session, user: { ...session.user, id: '2' }, sessionKey: 'outra-conta' })
  await expect(repository.listar()).rejects.toThrow('Sua sessão mudou')
  await expect(repository.editar(resposta.id, input)).rejects.toThrow('Sua sessão mudou')
  expect(api.request).not.toHaveBeenCalled()
})

test('não usa dados demonstrativos quando a sessão é mock', async () => {
  const mockSession: AuthSession = { ...session, mode: 'mock', sessionKey: 'mock-key' }
  sessionStore.save(mockSession)
  const repository = criarApiSessoesEstudo(mockSession)
  await expect(repository.listarDisciplinas()).rejects.toThrow('Sua sessão mudou')
  await expect(repository.listar()).rejects.toThrow('Sua sessão mudou')
  expect(api.request).not.toHaveBeenCalled()
})
