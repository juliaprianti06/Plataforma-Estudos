import { LogOut, X } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { currentUser, navigationItems } from '@/data/dashboard'
import { cn } from '@/lib/utils'

import { Brand } from './brand'

type SidebarProps = {
  open: boolean
  onClose: () => void
  onNavigate: (label: string) => void
}

export function Sidebar({ open, onClose, onNavigate }: SidebarProps) {
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
          'fixed inset-y-0 left-0 z-50 w-[248px] flex-col bg-[#302468] text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-20 lg:flex lg:h-screen lg:w-[216px] lg:translate-x-0 lg:shadow-none xl:w-[232px]',
          open ? 'flex translate-x-0' : 'hidden -translate-x-full',
        )}
      >
        <div className="flex h-[72px] items-center justify-between px-5 lg:h-[82px]">
          <Brand />
          <Button
            aria-label="Fechar menu"
            className="text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X />
          </Button>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 px-3">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  <button
                    aria-current={item.active ? 'page' : undefined}
                    className={cn(
                      'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium text-violet-100/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                      item.active && 'bg-white/15 text-white shadow-sm',
                    )}
                    onClick={() => {
                      onNavigate(item.label)
                      onClose()
                    }}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="size-[17px]" strokeWidth={1.7} />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => onNavigate('Perfil')}
            type="button"
          >
            <Avatar className="size-9 border border-white/20">
              <AvatarFallback className="bg-[#7d73a5] text-xs font-semibold text-white">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-white">
                {currentUser.name}
              </span>
              <span className="block text-[10px] text-violet-200/70">Ver perfil</span>
            </span>
            <LogOut aria-hidden="true" className="size-4 opacity-0 transition-opacity group-hover:opacity-70" />
          </button>
        </div>
      </aside>
    </>
  )
}
