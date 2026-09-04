import { Bell, Menu, Search, X } from 'lucide-react'

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
  return (
    <header className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <Button
          aria-label="Abrir menu"
          className="-ml-2 mt-0.5 text-[#302468] lg:hidden"
          onClick={onMenuOpen}
          size="icon"
          variant="ghost"
        >
          <Menu />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold tracking-[-0.025em] text-[#302468] sm:text-[22px]">
            Bom te ver, usuário
          </h1>
          <p className="mt-1 text-xs text-[#8b86a4] sm:text-[13px]">
            Continue de onde parou ou explore um grupo novo hoje.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:pt-0.5">
        <label className="relative flex-1 sm:w-[190px] sm:flex-none xl:w-[220px]">
          <span className="sr-only">Buscar tarefas</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6f6894]"
          />
          <input
            className="h-9 w-full rounded-full border border-[#d9d5eb] bg-white py-2 pl-9 pr-9 text-xs text-[#302468] shadow-sm outline-none transition focus:border-[#7868b1] focus:ring-3 focus:ring-[#7868b1]/15"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar..."
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-[#8b86a4] hover:bg-[#f1eff8]"
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
            className="relative text-[#70688f] hover:bg-white"
            onClick={onNotificationsToggle}
            size="icon"
            variant="ghost"
          >
            <Bell />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-[#f7f6fc] bg-[#f07178]" />
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-[#dfdbea] bg-white p-4 text-xs shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-[#302468]">Notificações</p>
                <span className="rounded-full bg-[#eeeaf9] px-2 py-0.5 text-[10px] font-bold text-[#5a4a94]">
                  {dashboardSummary.notifications} novas
                </span>
              </div>
              <p className="border-t border-[#eeecf5] py-3 text-[#69637f]">
                Sua atividade “Revisar cap. 5 de React” vence amanhã.
              </p>
              <p className="border-t border-[#eeecf5] pt-3 text-[#69637f]">
                O Workshop de React começa na próxima terça-feira.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
