import { Home, Users, BookOpen, ClipboardList, Trophy, Calendar, Timer, UserRound } from 'lucide-react'

export const navigationItems = [
  { label: 'Perfil', icon: UserRound, to: '/profile' },
  { label: 'Início', icon: Home, to: '/dashboard' },
  { label: 'Grupos', icon: Users, to: '/groups' },
  { label: 'Materiais', icon: BookOpen, to: '/materiais' },
  { label: 'Disciplinas', icon: ClipboardList, to: '/disciplinas' },
  { label: 'Progresso', icon: Trophy, to: '/progresso' },
  { label: 'Calendário', icon: Calendar },
  { label: 'Sessão de Estudos', icon: Timer },
] as const
