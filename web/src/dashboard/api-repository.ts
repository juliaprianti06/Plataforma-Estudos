import type { AuthSession } from '@/auth/types'
import { createSessionRequest } from '@/api/session-request'
import type { DashboardTask } from '@/data/dashboard'

export type TaskInput = {
  title: string; description: string; priority: DashboardTask['priority']; status: DashboardTask['status']
  dueAt: string | null; disciplineId: number | null
}
export type ApiTask = DashboardTask & TaskInput & { groupId: string; groupName: string; canEdit: boolean }
export type ApiEvent = { id: string; title: string; startsAt: string; groupId: string; groupName: string; canEdit: boolean }
export type EventInput = Pick<ApiEvent, 'title' | 'startsAt' | 'groupId'>
export type StudySummary = { total: number; completed: number; progress: number; activeTask: ApiTask | null }
export type DashboardData = { tasks: ApiTask[]; events: ApiEvent[]; notifications: string[]; summary: StudySummary }

function invalid(): never { throw new Error('Dados inv\u00e1lidos recebidos do servidor.') }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  return value as Record<string, unknown>
}
function date(value: unknown) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function group(value: Record<string, unknown>) {
  if (typeof value.groupId !== 'string' || !value.groupId || typeof value.groupName !== 'string' || typeof value.canEdit !== 'boolean') invalid()
}
function parseTask(value: unknown): ApiTask {
  const task = object(value); group(task)
  if (!Number.isInteger(task.id) || Number(task.id) <= 0 || typeof task.title !== 'string' || typeof task.detail !== 'string' ||
    typeof task.description !== 'string' || !['todo', 'progress', 'done'].includes(String(task.status)) ||
    !['high', 'medium', 'low'].includes(String(task.priority)) || (task.dueAt !== null && !date(task.dueAt)) ||
    (task.disciplineId !== null && (!Number.isInteger(task.disciplineId) || Number(task.disciplineId) <= 0))) invalid()
  return task as ApiTask
}
function parseEvent(value: unknown): ApiEvent {
  const event = object(value); group(event)
  if (typeof event.id !== 'string' || !event.id || typeof event.title !== 'string' || !date(event.startsAt)) invalid()
  return event as ApiEvent
}
export function taskInput(task: ApiTask): TaskInput {
  return { title: task.title, description: task.description, status: task.status, priority: task.priority, dueAt: task.dueAt, disciplineId: task.disciplineId }
}
export function createDashboardRepository(session: AuthSession) {
  const request = createSessionRequest(session)
  return {
    async load(): Promise<DashboardData> {
      const data = object(await request('get', '/dashboard'))
      if (!Array.isArray(data.tasks) || !Array.isArray(data.events) || !Array.isArray(data.notifications) || data.notifications.some(item => typeof item !== 'string')) invalid()
      const summary = object(data.summary)
      if (![summary.total, summary.completed, summary.progress].every(Number.isInteger) || Number(summary.total) < 0 || Number(summary.completed) < 0 ||
        Number(summary.completed) > Number(summary.total) || Number(summary.progress) < 0 || Number(summary.progress) > 100) invalid()
      return { tasks: data.tasks.map(parseTask), events: data.events.map(parseEvent), notifications: data.notifications as string[],
        summary: { total: Number(summary.total), completed: Number(summary.completed), progress: Number(summary.progress), activeTask: summary.activeTask === null ? null : parseTask(summary.activeTask) } }
    },
    createTask: async (input: TaskInput & { groupId: string }) => parseTask(await request('post', '/tasks', input)),
    updateTask: async (id: number, input: TaskInput) => parseTask(await request('put', `/tasks/${id}`, input)),
    deleteTask: async (id: number) => { await request('delete', `/tasks/${id}`) },
    createEvent: async (input: EventInput) => parseEvent(await request('post', '/events', input)),
    deleteEvent: async (id: string) => { await request('delete', `/events/${encodeURIComponent(id)}`) },
  }
}
