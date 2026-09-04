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
  day: string
  month: string
  title: string
  schedule: string
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
    day: '12',
    month: 'OUT',
    title: 'Workshop de React',
    schedule: 'Terça-feira, 14:00',
  },
  {
    id: 2,
    day: '13',
    month: 'OUT',
    title: 'Revisão de grupo',
    schedule: 'Quarta-feira, 10:00',
  },
  {
    id: 3,
    day: '15',
    month: 'OUT',
    title: 'Apresentação final',
    schedule: 'Sexta-feira, 16:00',
  },
]

export const dashboardSummary = {
  activeCourse: 'Trilha de React - Hooks avançados',
  courseProgress: 82,
  notifications: 2,
}
