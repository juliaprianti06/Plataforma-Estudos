import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { SessionFormDialog } from '@/study-sessions/components/SessionFormDialog'
import { dataLocal } from '@/lib/study-sessions'

const disciplina = { id: 1, nome: 'Matemática', cor: 'bg-success' }
function abrir() {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  const result = render(<SessionFormDialog disciplinas={[disciplina]} onClose={onClose} onSubmit={onSubmit} />)
  return { ...result, onSubmit, onClose }
}

describe('modal de sessão', () => {
  test('foca a disciplina, exige seleção e impede término anterior ou igual ao início', async () => {
    const { onSubmit } = abrir()
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Registrar sessão')
    expect(screen.getByLabelText('Disciplina')).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('Selecione uma disciplina.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } })
    for (const value of ['13:00', '14:00']) {
      fireEvent.change(screen.getByLabelText('Término'), { target: { value } })
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      expect(screen.getByLabelText('Término')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByText('O término deve ser após o início.')).toBeInTheDocument()
    }
    expect(onSubmit).not.toHaveBeenCalled()
  }, 30_000)

  test('calcula duração e envia os campos válidos antes de fechar', async () => {
    const { onSubmit, onClose } = abrir()
    expect(screen.getByLabelText('Data')).toHaveValue(dataLocal(new Date()))
    expect(screen.getByLabelText('Duração')).toHaveTextContent('1h30')
    fireEvent.change(screen.getByLabelText('Término'), { target: { value: '16:15' } })
    expect(screen.getByLabelText('Duração')).toHaveTextContent('2h15')
    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Revisão' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({ disciplina, data: dataLocal(new Date()), inicio: '14:00', termino: '16:15', observacao: 'Revisão' })
  }, 30_000)

  test('preenche edição e mantém o modal aberto quando salvar falha', async () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockRejectedValue(new Error('offline'))
    render(<SessionFormDialog disciplinas={[disciplina]} sessao={{ id: 's1', disciplina, data: '2026-10-28', inicio: '09:00', termino: '10:15', duracaoMinutos: 75, observacao: 'Teste' }} onClose={onClose} onSubmit={onSubmit} />)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Editar sessão')
    expect(screen.getByLabelText('Disciplina')).toHaveValue('1')
    expect(screen.getByLabelText('Duração')).toHaveTextContent('1h15')
    expect(screen.getByLabelText('Data')).toHaveValue('2026-10-28')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('offline')
    expect(onClose).not.toHaveBeenCalled()
  }, 30_000)

  test.each(['Cancelar', 'Fechar', 'Escape', 'fundo'])('fecha pelo controle %s', async controle => {
    const { onClose, container } = abrir()
    const user = userEvent.setup()
    if (controle === 'Escape') await user.keyboard('{Escape}')
    else if (controle === 'fundo') await user.click(document.querySelector('[data-slot="dialog-overlay"]')!)
    else fireEvent.click(screen.getByRole('button', { name: controle }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(container).toBeInTheDocument()
  }, 30_000)
})
