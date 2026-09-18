import { Bell, Menu, Search, X } from 'lucide-react'

import { useProfile } from '@/profile/use-profile'
import { Button } from '@/components/ui/button'

type DashboardHeaderProps = {
  notifications?: string[]
  query: string
  onQueryChange: (query: string) => void
  onMenuOpen: () => void
  notificationsOpen: boolean
  onNotificationsToggle: () => void
}

export function DashboardHeader({
  notifications: remoteNotifications,
  query,
  onQueryChange,
  onMenuOpen,
  notificationsOpen,
  onNotificationsToggle,
}: DashboardHeaderProps) {
  const profile = useProfile()
  const notifications = remoteNotifications ?? [
    ...(profile?.notifications.tasks !== false ? ['Sua atividade “Revisar cap. 5 de React” vence amanhã.'] : []),
    ...(profile?.notifications.groups !== false ? ['Workshop de React: confira a data nos próximos eventos.'] : []),
  ]
  return (
    <header className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <Button
          aria-label="Abrir menu"
          className="-ml-2 mt-0.5 text-primary lg:hidden"
          onClick={onMenuOpen}
          size="icon"
          variant="ghost"
        >
          <Menu />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-[-0.025em] text-primary sm:text-[22px]">
            Bom te ver, {profile?.name.split(' ')[0] ?? 'estudante'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-[13px]">
            Continue de onde parou ou explore um grupo novo hoje.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:pt-0.5">
        <label className="relative flex-1 sm:w-[190px] sm:flex-none xl:w-[220px]">
          <span className="sr-only">Buscar tarefas</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-9 w-full rounded-full border border-border bg-card py-2 pl-9 pr-9 text-xs text-primary shadow-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/15"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar..."
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => onQueryChange('')}
              type="button"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </label>

        <div className="relative">
          <Button
            aria-expanded={notificationsOpen}
            aria-label={`${notifications.length} notificações`}
            className="relative text-muted-foreground hover:bg-card"
            onClick={onNotificationsToggle}
            size="icon"
            variant="ghost"
          >
            <Bell />
            {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-destructive" />}
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-border bg-card p-4 text-xs shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-primary">Notificações</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-primary">
                  {notifications.length} novas
                </span>
              </div>
              {notifications.length ? notifications.map((notification) => (
                <p key={notification} className="border-t border-border py-3 text-muted-foreground">{notification}</p>
              )) : (
                <p className="border-t border-border pt-3 leading-relaxed text-muted-foreground">Nenhuma notificação no momento. Confira suas preferências no perfil.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
