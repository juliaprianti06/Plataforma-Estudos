import { Bell, Menu, Search, X } from 'lucide-react'

import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import { dashboardSummary } from '@/data/dashboard'

type DashboardHeaderProps = {
  query: string
  onQueryChange: (query: string) => void
  onMenuOpen: () => void
  notificationsOpen: boolean
  onNotificationsToggle: () => void
}

export function DashboardHeader({
  query,
  onQueryChange,
  onMenuOpen,
  notificationsOpen,
  onNotificationsToggle,
}: DashboardHeaderProps) {
  const session = useAuth()
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
            Bom te ver, {session?.user.name.split(' ')[0] ?? 'estudante'}
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
            aria-label={`${dashboardSummary.notifications} notificações`}
            className="relative text-muted-foreground hover:bg-card"
            onClick={onNotificationsToggle}
            size="icon"
            variant="ghost"
          >
            <Bell />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-destructive" />
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-border bg-card p-4 text-xs shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-primary">Notificações</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-primary">
                  {dashboardSummary.notifications} novas
                </span>
              </div>
              <p className="border-t border-border py-3 text-muted-foreground">
                Sua atividade “Revisar cap. 5 de React” vence amanhã.
              </p>
              <p className="border-t border-border pt-3 text-muted-foreground">
                Workshop de React: confira a data nos próximos eventos.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
