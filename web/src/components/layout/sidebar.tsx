import { useState } from 'react'
import { Brain, LogOut, MonitorX, X } from 'lucide-react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { navigationItems } from './navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { auth } from '@/auth/auth'
import { useAuth } from '@/auth/use-auth'
import { cn } from '@/lib/utils'

type SidebarProps = {
  open: boolean
  onClose: () => void
  onNavigate: (label: string) => void
}

export function Sidebar({ open, onClose, onNavigate }: SidebarProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const session = useAuth()
  const navigate = useNavigate()
  const [logoutAllOpen, setLogoutAllOpen] = useState(false)
  const [logoutAllPending, setLogoutAllPending] = useState(false)
  const initials = session?.user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  async function handleLogout() {
    await auth.logout()
    navigate({ to: '/' })
  }

  async function handleLogoutAll() {
    setLogoutAllPending(true)
    try {
      await auth.logoutAll()
    } catch {
      window.alert(
        'Sua sessão atual foi encerrada, mas não foi possível confirmar a saída dos outros dispositivos.',
      )
    } finally {
      setLogoutAllPending(false)
      setLogoutAllOpen(false)
      navigate({ to: '/' })
    }
  }


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
              const isActive = 'to' in item && (pathname === item.to || pathname.startsWith(`${item.to}/`))
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
            onClick={handleLogout}
            type="button"
          >
            <Avatar className="size-10 border border-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                {session?.user.name ?? 'Usuário'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-sidebar-foreground/60">
                <LogOut aria-hidden="true" className="size-3" />
                Sair
              </span>
            </span>
          </button>
          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            onClick={() => setLogoutAllOpen(true)}
            type="button"
          >
            <MonitorX aria-hidden="true" className="size-3.5" />
            Sair de todos os dispositivos
          </button>
        </div>
      </aside>
      <Dialog
        onOpenChange={(isOpen) => {
          if (!logoutAllPending) setLogoutAllOpen(isOpen)
        }}
        open={logoutAllOpen}
      >
        <DialogContent showCloseButton={!logoutAllPending}>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <MonitorX aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle>Sair de todos os dispositivos?</DialogTitle>
            <DialogDescription>
              Todas as sessões desta conta serão encerradas, incluindo esta. Será necessário entrar novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={logoutAllPending} variant="outline">Cancelar</Button>
            </DialogClose>
            <Button disabled={logoutAllPending} onClick={handleLogoutAll} variant="destructive">
              {logoutAllPending ? 'Saindo...' : 'Sair de todos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
