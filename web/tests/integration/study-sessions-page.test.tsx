import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { ReactNode } from 'react'
import { StudySessionsPage } from '@/study-sessions/StudySessionsPage'
import { dataLocal } from '@/lib/study-sessions'
import type { SessaoEstudo } from '@/study-sessions/type'

const { repo, getSession, factory } = vi.hoisted(() => {
  const repo = { listarDisciplinas: vi.fn(), listar: vi.fn(), criar: vi.fn(), editar: vi.fn(), excluir: vi.fn() }
  return { repo, getSession: vi.fn(), factory: vi.fn(() => repo) }
})
vi.mock('@/auth/use-auth', () => ({ useAuth: getSession }))
vi.mock('@/api/study-sessions', () => ({ criarApiSessoesEstudo: factory }))
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: ReactNode }) => <span>{children}</span>, Navigate: () => null }))

const session = { user: { id: '1', name: 'Estudante', email: 'estudante@example.com' }, sessionKey: 'token-api', expiresAt: Date.now() + 3600000, mode: 'api' as const }
const disciplina = { id: 1, nome: 'Matemática', cor: 'bg-success' }
const historicoVazio = 'Nenhuma sessão registrada. Registre sua primeira sessão de estudo.'
function registro(): SessaoEstudo {
  return { id: '00000000-0000-0000-0000-000000000001', disciplina, data: dataLocal(new Date()), inicio: '18:00', termino: '23:00', duracaoMinutos: 300, observacao: 'Sessão registrada via API' }
}

beforeEach(() => {
  vi.resetAllMocks()
  factory.mockReturnValue(repo)
  getSession.mockReturnValue(session)
  repo.listarDisciplinas.mockResolvedValue([disciplina])
  repo.listar.mockResolvedValue([])
  repo.criar.mockResolvedValue(registro())
  repo.editar.mockResolvedValue({ ...registro(), termino: '22:00', duracaoMinutos: 240 })
  repo.excluir.mockResolvedValue(undefined)
})

describe('sessões conectadas à API', () => {
  test('mostra zero e histórico vazio quando a API não possui registros, sem criar exemplos', async () => {
    render(<StudySessionsPage />)
    expect(await screen.findByText(historicoVazio)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Resumo das sessões' })).getAllByText('0h00')).toHaveLength(2)
    expect(screen.queryByText(/Dados demonstrativos/)).not.toBeInTheDocument()
    expect(repo.listar).toHaveBeenCalledExactlyOnceWith()
    expect(repo.criar).not.toHaveBeenCalled()
  }, 30_000)

  test('atualiza a tela com as respostas da API e reconsulta os registros ao abrir novamente', async () => {
    const { unmount } = render(<StudySessionsPage />)
    await screen.findByRole('heading', { name: 'Histórico de sessões' })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar sessão' }))
    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText('Término'), { target: { value: '23:00' } })
    fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Sessão registrada via API' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(repo.criar).toHaveBeenCalledWith({ disciplina, data: dataLocal(new Date()), inicio: '18:00', termino: '23:00', observacao: 'Sessão registrada via API' })
    let linha = screen.getByText('Sessão registrada via API').closest('li')!
    expect(within(linha).getByText('5h00')).toBeInTheDocument()
    fireEvent.click(within(linha).getByRole('button', { name: /Editar sessão/ }))
    fireEvent.change(screen.getByLabelText('Término'), { target: { value: '22:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(repo.editar).toHaveBeenCalledWith(registro().id, expect.objectContaining({ termino: '22:00' }))
    expect(within(screen.getByText('Sessão registrada via API').closest('li')!).getByText('4h00')).toBeInTheDocument()
    unmount()
    repo.listar.mockResolvedValue([{ ...registro(), termino: '22:00', duracaoMinutos: 240 }])
    render(<StudySessionsPage />)
    linha = (await screen.findByText('Sessão registrada via API')).closest('li')!
    expect(repo.listar).toHaveBeenCalledTimes(2)
    fireEvent.click(within(linha).getByRole('button', { name: /Excluir sessão/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(repo.excluir).not.toHaveBeenCalled()
    fireEvent.click(within(linha).getByRole('button', { name: /Excluir sessão/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/ }))
    await waitFor(() => expect(screen.queryByText('Sessão registrada via API')).not.toBeInTheDocument())
    expect(repo.excluir).toHaveBeenCalledExactlyOnceWith(registro().id)
    expect(within(screen.getByRole('region', { name: 'Resumo das sessões' })).getAllByText('0h00')).toHaveLength(2)
  }, 120_000)

  test('mostra erro de consulta e permite nova tentativa sem fallback para exemplos', async () => {
    repo.listar.mockRejectedValueOnce(new Error('offline'))
    render(<StudySessionsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar')
    expect(screen.queryByRole('heading', { name: 'Histórico de sessões' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText(historicoVazio)).toBeInTheDocument()
    expect(repo.listar).toHaveBeenCalledTimes(2)
    expect(repo.criar).not.toHaveBeenCalled()
  }, 30_000)

  test('não adiciona uma sessão local quando a gravação falha', async () => {
    repo.criar.mockRejectedValueOnce(new Error('Não foi possível gravar no servidor.'))
    render(<StudySessionsPage />)
    await screen.findByText(historicoVazio)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar sessão' }))
    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gravar no servidor.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(historicoVazio)).toBeInTheDocument()
    expect(repo.criar).toHaveBeenCalledOnce()
  }, 30_000)

  test('mantém a sessão e os totais quando a exclusão no servidor falha', async () => {
    repo.listar.mockResolvedValue([registro()])
    repo.excluir.mockRejectedValueOnce(new Error('offline'))
    render(<StudySessionsPage />)
    const linha = (await screen.findByText('Sessão registrada via API')).closest('li')!
    fireEvent.click(within(linha).getByRole('button', { name: /Excluir sessão/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível excluir')
    expect(within(linha).getByText('5h00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/ }))
    await waitFor(() => expect(screen.queryByText('Sessão registrada via API')).not.toBeInTheDocument())
    expect(repo.excluir).toHaveBeenCalledTimes(2)
  }, 30_000)

  test('não oferece sessões demonstrativas para uma conta mock', () => {
    getSession.mockReturnValue({ ...session, mode: 'mock', sessionKey: 'mock-key' })
    render(<StudySessionsPage />)
    expect(screen.getByText(/Entre com uma conta conectada ao servidor/)).toBeInTheDocument()
    expect(factory).not.toHaveBeenCalled()
    expect(repo.listar).not.toHaveBeenCalled()
  })
})
