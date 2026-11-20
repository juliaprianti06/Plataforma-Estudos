import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import type { ReactNode } from 'react'
import { StudySessionsPage } from '@/study-sessions/StudySessionsPage'
import { dataLocal } from '@/lib/study-sessions'

vi.mock('@/auth/use-auth', () => ({ useAuth: () => session }))
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: { children: ReactNode }) => <span>{children}</span>, Navigate: () => null }))
const session = { user: { id: 'study-page-test', name: 'Estudante', email: 'estudante@example.com' }, accessToken: null, expiresAt: Date.now() + 3600000, mode: 'mock' as const }

describe('página de sessões', () => {
  test('atualiza histórico, resumo e gráficos ao criar, editar e confirmar exclusão; mantém dados ao navegar', async () => {
    const { unmount } = render(<StudySessionsPage />)
    await screen.findByRole('heading', { name: 'Histórico de sessões' })
    const resumo = screen.getByRole('region', { name: 'Resumo das sessões' })
    const minutosAntes = within(resumo).getByText('Este mês').parentElement!.parentElement!.textContent
    fireEvent.click(screen.getByRole('button', { name: 'Registrar sessão' }))
    fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '18:00' } })
    fireEvent.change(screen.getByLabelText('Término'), { target: { value: '23:00' } })
    fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Sessão de teste' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const linha = screen.getByText('Sessão de teste').closest('li')!
    expect(within(linha).getByText('5h00')).toBeInTheDocument()
    expect(within(resumo).getByText('Este mês').parentElement!.parentElement!.textContent).not.toBe(minutosAntes)
    expect(screen.getByRole('region', { name: 'Gráficos do tempo de estudo' })).toHaveTextContent('Matemática')
    fireEvent.click(within(linha).getByRole('button', { name: /Editar sessão/ }))
    expect(screen.getByLabelText('Data')).toHaveValue(dataLocal(new Date()))
    expect(screen.getByLabelText('Observação (opcional)')).toHaveValue('Sessão de teste')
    fireEvent.change(screen.getByLabelText('Término'), { target: { value: '22:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(screen.getByText('Sessão de teste').closest('li')!).getByText('4h00')).toBeInTheDocument()
    unmount()
    render(<StudySessionsPage />)
    const linhaRestaurada = (await screen.findByText('Sessão de teste')).closest('li')!
    fireEvent.click(within(linhaRestaurada).getByRole('button', { name: /Excluir sessão/ }))
    expect(screen.getByText('Sessão de teste')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Sessão de teste')).toBeInTheDocument()
    fireEvent.click(within(linhaRestaurada).getByRole('button', { name: /Excluir sessão/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Excluir$/ }))
    await waitFor(() => expect(screen.queryByText('Sessão de teste')).not.toBeInTheDocument())
    expect(within(screen.getByRole('region', { name: 'Resumo das sessões' })).getByText('Este mês').parentElement!.parentElement!.textContent).toBe(minutosAntes)
  })
})
