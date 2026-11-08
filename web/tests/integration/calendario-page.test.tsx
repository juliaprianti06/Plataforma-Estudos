import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Calendario from '@/pages/calendario'

const { calendarTasks, calendarEvents, createEvent } = vi.hoisted(() => ({ calendarTasks: vi.fn(), calendarEvents: vi.fn(), createEvent: vi.fn() }))

vi.mock('@/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: '1', name: 'Julia', email: 'julia@example.com' }, accessToken: 'token', expiresAt: Date.now() + 60_000, mode: 'api' }),
}))

vi.mock('@/dashboard/api-repository', () => ({
  createDashboardRepository: () => ({ calendarTasks, calendarEvents, createEvent }),
}))

function taskForDay(day: number) {
  const date = new Date()
  return {
    id: 1, title: 'Revisar Python', description: '', priority: 'medium' as const, status: 'todo' as const,
    dueAt: new Date(date.getFullYear(), date.getMonth(), day, 12).toISOString(), disciplineId: 1,
    groupId: 'personal', groupName: 'Python', detail: 'Python', canEdit: true,
  }
}

describe('calendar page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    calendarTasks.mockResolvedValue([])
    calendarEvents.mockResolvedValue([])
    createEvent.mockResolvedValue({})
  })

  test('loads tasks, navigates between months, and selects a date', async () => {
    calendarTasks.mockResolvedValue([taskForDay(15)])
    const user = userEvent.setup()

    render(<Calendario />)

    expect(screen.getByLabelText('Carregando calendário')).toBeInTheDocument()
    expect(await screen.findByText('Revisar Python')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Atividades em/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await waitFor(() => expect(screen.queryByText('Revisar Python')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(await screen.findByText('Revisar Python')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^15/ }))
    expect(screen.getAllByText('Revisar Python').length).toBeGreaterThan(0)
  })

  test('displays an error when the endpoint fails', async () => {
    calendarTasks.mockRejectedValue(new Error('Falha de rede'))

    render(<Calendario />)

    expect(await screen.findByText('Falha de rede')).toBeInTheDocument()
  })

  test('opens the personal event form and creates an event without a group', async () => {
    const user = userEvent.setup()
    render(<Calendario />)

    await user.click(screen.getByRole('button', { name: 'Novo evento pessoal' }))
    expect(screen.getByRole('heading', { name: 'Novo evento pessoal' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Título'), 'Reunião de estudos')
    fireEvent.change(screen.getByLabelText('Data e horário'), { target: { value: '2099-10-25T14:00' } })
    await user.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() => expect(createEvent).toHaveBeenCalledWith({
      title: 'Reunião de estudos',
      startsAt: expect.any(String),
      groupId: null,
    }))
  })

  test('rejects a personal event scheduled in the past', async () => {
    const user = userEvent.setup()
    render(<Calendario />)

    await user.click(screen.getByRole('button', { name: 'Novo evento pessoal' }))
    await user.type(screen.getByLabelText('Título'), 'Evento antigo')
    fireEvent.change(screen.getByLabelText('Data e horário'), { target: { value: '2000-01-01T10:00' } })
    await user.click(screen.getByRole('button', { name: 'Criar evento' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Escolha uma data futura.')
    expect(createEvent).not.toHaveBeenCalled()
  })
})
