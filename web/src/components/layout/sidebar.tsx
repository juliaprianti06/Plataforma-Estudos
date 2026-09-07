import { useState } from 'react'
import { 
  LogOut, 
  X, 
  Brain, 
  Home, 
  Users, 
  BookOpen, 
  ClipboardList, 
  Trophy, 
  Calendar, 
  Timer 
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { currentUser } from '@/data/dashboard'
import { cn } from '@/lib/utils'

type SidebarProps = {
  open: boolean
  onClose: () => void
  onNavigate: (label: string) => void
  activeRoute?: string 
}

export function Sidebar({ open, onClose, onNavigate, activeRoute = 'Início' }: SidebarProps) {
  const [currentActive, setCurrentActive] = useState(activeRoute)
  
  const navigationItems = [
    { label: 'Início', icon: Home },
    { label: 'Grupos', icon: Users },
    { label: 'Materiais', icon: BookOpen },
    { label: 'Disciplinas', icon: ClipboardList },
    { label: 'Progresso', icon: Trophy },
    { label: 'Calendário', icon: Calendar },
    { label: 'Sessão de Estudos', icon: Timer },
  ]

  return (
    <>
      <button
        aria-label="Fechar menu lateral"
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity lg:hidden',
          open ? 'block opacity-100' : 'hidden opacity-0',
        )}
        onClick={onClose}
        type="button"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground font-sans shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-[216px] lg:translate-x-0 lg:shadow-none xl:w-[232px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-[72px] items-center justify-between px-6 lg:h-[82px]">
          <div className="flex items-center gap-2">
            <Brain className="size-6 text-sidebar-foreground" strokeWidth={2} />
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
              MindSpace<span className="text-sidebar-primary">.</span>
            </span>
          </div>
          <Button
            aria-label="Fechar menu"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X />
          </Button>
        </div>

        <nav aria-label="Navegação principal" className="px-3 pb-4 border-b border-dotted border-white/20">
          <ul className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentActive === item.label
              
              return (
                <li key={item.label}>
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring',
                      isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                    onClick={() => {
                      setCurrentActive(item.label) 
                      onNavigate(item.label)       
                      onClose()                  
                    }}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="size-[18px]" strokeWidth={2} />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex-1"></div>

        <div className="border-t border-dotted border-white/20 p-4">
          <button
            className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            onClick={() => {
              setCurrentActive('Perfil') 
              onNavigate('Perfil')
            }}
            type="button"
          >
            <Avatar className="size-10 border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-bold">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                {currentUser.name}
              </span>
              <span className="block text-[11px] text-sidebar-foreground/60">
                Ver perfil
              </span>
            </span>
            <LogOut aria-hidden="true" className="size-4 opacity-0 transition-opacity group-hover:opacity-100 text-sidebar-foreground" />
          </button>
        </div>
      </aside>
    </>
  )
}