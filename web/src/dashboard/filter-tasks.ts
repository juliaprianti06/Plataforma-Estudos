import type { DashboardTask } from '../data/dashboard.ts'

export type TaskFilters = { query: string; group: string; discipline: string; priority: string; status: string; overdue: boolean; sort: 'due' | 'priority' | 'recent' }
export const defaultTaskFilters: TaskFilters = { query: '', group: '', discipline: '', priority: '', status: '', overdue: false, sort: 'due' }
function due(task: DashboardTask) {
  return 'dueAt' in task && typeof task.dueAt === 'string' ? Date.parse(task.dueAt) : Infinity
}
export function filterTasks<T extends DashboardTask>(tasks: T[], filters: TaskFilters, now = Date.now()): T[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const query = normalize(filters.query.trim())
  return tasks.filter(task => (!query || normalize(`${task.title} ${task.detail}`).includes(query)) &&
    (!filters.group || ('groupId' in task && task.groupId === filters.group)) &&
    (!filters.discipline || ('disciplineId' in task && String(task.disciplineId) === filters.discipline)) &&
    (!filters.priority || task.priority === filters.priority) && (!filters.status || task.status === filters.status) &&
    (!filters.overdue || (task.status !== 'done' && due(task) < now)))
    .sort((a, b) => {
      if (filters.sort === 'priority') return ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority) || a.id - b.id
      if (filters.sort === 'recent') return b.id - a.id
      return due(a) - due(b) || a.id - b.id
    })
}
