import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FolderOpen,
  House,
  Trophy,
  Users,
} from 'lucide-react'

export type NavigationItem = {
  label: string
  icon: LucideIcon
  active?: boolean
}

export type TaskStatus = 'todo' | 'progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'

export type DashboardTask = {
  id: number
  title: string
  detail: string
  status: TaskStatus
  priority: TaskPriority
}

export type DashboardEvent = {
  id: number
  startsAt: string
  title: string
}

export const currentUser = {
  name: 'Usuário',
  initials: 'US',
}

export const navigationItems: NavigationItem[] = [
  { label: 'Início', icon: House, active: true },
  { label: 'Grupos', icon: Users },
  { label: 'Materiais', icon: FolderOpen },
  { label: 'Disciplinas', icon: BookOpen },
  { label: 'Progresso', icon: Trophy },
  { label: 'Calendário', icon: CalendarDays },
  { label: 'Sessão de Estudos', icon: Clock3 },
]

export const tasks: DashboardTask[] = [
  {
    id: 1,
    title: 'Revisar cap. 5 de React',
    detail: 'Vence amanhã',
    status: 'todo',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Preparar slides UX',
    detail: 'Vence sexta',
    status: 'todo',
    priority: 'medium',
  },
  {
    id: 3,
    title: 'Organizar referências',
    detail: 'Vence sábado',
    status: 'todo',
    priority: 'low',
  },
  {
    id: 4,
    title: 'Responder exercícios',
    detail: 'Vence domingo',
    status: 'todo',
    priority: 'medium',
  },
  {
    id: 5,
    title: 'Estudo de hooks',
    detail: 'Vence terça',
    status: 'progress',
    priority: 'high',
  },
  {
    id: 6,
    title: 'Leitura artigo IA',
    detail: 'Vence quinta',
    status: 'progress',
    priority: 'low',
  },
  {
    id: 7,
    title: 'Quiz JavaScript',
    detail: 'Concluído',
    status: 'done',
    priority: 'low',
  },
  {
    id: 8,
    title: 'Resumo cap. 3',
    detail: 'Concluído',
    status: 'done',
    priority: 'low',
  },
]

export const upcomingEvents: DashboardEvent[] = [
  {
    id: 1,
    startsAt: '2026-10-12T14:00:00-03:00',
    title: 'Workshop de React',
  },
  {
    id: 2,
    startsAt: '2026-10-13T10:00:00-03:00',
    title: 'Revisão de grupo',
  },
  {
    id: 3,
    startsAt: '2026-10-15T16:00:00-03:00',
    title: 'Apresentação final',
  },
]

export const dashboardSummary = {
  activeCourse: 'Trilha de React - Hooks avançados',
  courseProgress: 82,
  notifications: 2,
}
