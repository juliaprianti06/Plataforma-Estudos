import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AxiosError } from 'axios'
import { beforeEach, expect, test, vi } from 'vitest'
import DisciplinaModal from '@/pages/disciplinas/modal-disciplinas'
import { api } from '@/api/client'

vi.mock('@/api/client', () => ({ api: { post: vi.fn(), put: vi.fn() } }))

beforeEach(() => { vi.resetAllMocks() })

test('mostra falha de conexão sem apagar os campos e permite salvar na segunda tentativa', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK')).mockResolvedValueOnce({ data: { id: 1 } })
  const onSuccess = vi.fn()
  const onClose = vi.fn()
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  try {
    render(<DisciplinaModal isOpen onSuccess={onSuccess} onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Segurança da Informação' } })
    fireEvent.change(screen.getByLabelText('Professor'), { target: { value: 'Prof. Rodrigo' } })
    fireEvent.change(screen.getByLabelText('Descrição (opcional)'), { target: { value: 'Pentest e scanning' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor')
    expect(screen.getByLabelText('Nome')).toHaveValue('Segurança da Informação')
    expect(screen.getByLabelText('Descrição (opcional)')).toHaveValue('Pentest e scanning')
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
    expect(onClose).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(alertSpy).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(api.post).toHaveBeenLastCalledWith('/disciplinas/', { nome: 'Segurança da Informação', professor: 'Prof. Rodrigo', descricao: 'Pentest e scanning', cor: 'bg-accent', ativo: true })
  } finally { alertSpy.mockRestore() }
}, 60_000)

test('exibe a mensagem devolvida pela API ao editar sem fechar o formulário', async () => {
  vi.mocked(api.put).mockRejectedValueOnce({ isAxiosError: true, response: { status: 422, data: { mensagem: 'Verifique os campos informados.' } } })
  const onClose = vi.fn()
  render(<DisciplinaModal isOpen disciplina={{ id: 7, nome: 'Matemática', professor: 'Ana', descricao: '', cor: 'bg-success' }} onClose={onClose} />)
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Verifique os campos informados.')
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
  expect(api.put).toHaveBeenCalledWith('/disciplinas/7', expect.objectContaining({ nome: 'Matemática' }))
}, 30_000)
