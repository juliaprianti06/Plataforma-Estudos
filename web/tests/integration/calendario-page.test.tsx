import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Calendario from '@/pages/calendario'

const { calendarTasks, calendarEvents } = vi.hoisted(() => ({ calendarTasks: vi.fn(), calendarEvents: vi.fn() }))

vi.mock('@/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: '1', name: 'Julia', email: 'julia@example.com' }, accessToken: 'token', expiresAt: Date.now() + 60_000, mode: 'api' }),
}))

vi.mock('@/dashboard/api-repository', () => ({
  createDashboardRepository: () => ({ calendarTasks, calendarEvents }),
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
    calendarEvents.mockResolvedValue([])
  })

  test('loads tasks, navigates between months, and selects a date', async () => {
    calendarTasks.mockResolvedValue([taskForDay(15)])
    const user = userEvent.setup()

    render(<Calendario />)

    expect(screen.getByLabelText('Carregando calendário')).toBeInTheDocument()
    expect(await screen.findByText('Revisar Python')).toBeInTheDocument()
    expect(screen.getByText('Atividades em')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }))
    await waitFor(() => expect(screen.queryByText('Revisar Python')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Mês anterior' }))
    expect(await screen.findByText('Revisar Python')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^15/ }))
    expect(screen.getByText('Revisar Python')).toBeInTheDocument()
  })

  test('displays an error when the endpoint fails', async () => {
    calendarTasks.mockRejectedValue(new Error('Falha de rede'))

    render(<Calendario />)

    expect(await screen.findByText('Falha de rede')).toBeInTheDocument()
  })
})
