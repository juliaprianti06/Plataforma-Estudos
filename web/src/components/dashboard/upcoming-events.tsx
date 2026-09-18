import { useState } from 'react'
import type { ApiEvent } from '@/dashboard/api-repository'
import { CalendarClock } from 'lucide-react'

import { upcomingEvents } from '@/data/dashboard'
import { formatEventDate } from '@/lib/event-date'

export function UpcomingEvents({ events, onDelete, busy = false }: { events?: ApiEvent[]; onDelete?: (id: string) => void; busy?: boolean }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm shadow-primary/5">
      <h2 className="text-xs font-bold text-primary">Próximos eventos</h2>

      <div className="mt-2">
        {events?.length === 0 && <p className="py-3 text-xs text-muted-foreground">Nenhum evento agendado.</p>}
        {(events ?? upcomingEvents).map((event) => {
          const date = formatEventDate(event.startsAt)

          return (
            <article
              className="flex items-center gap-3 border-b border-border py-3 last:border-0 last:pb-1"
              key={event.id}
            >
              <time
                className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-center text-primary"
                dateTime={event.startsAt}
              >
                <span className="block text-[13px] font-bold leading-3">{date.day}</span>
                <span className="block text-[7px] font-semibold leading-3">{date.month}</span>
              </time>
              <div className="min-w-0">
                <h3 className="truncate text-[10px] font-bold text-primary">{event.title}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-[8px] text-muted-foreground">
                  <CalendarClock aria-hidden="true" className="size-2.5" />
                  {date.schedule}
                </p>
                {'groupName' in event && <p className="mt-1 text-[9px] text-muted-foreground">{event.groupName}</p>}
                {'canEdit' in event && event.canEdit && onDelete && <button type="button" disabled={busy} className="mt-1 rounded text-[10px] text-destructive focus-visible:outline-ring" onClick={() => {
                  if (confirmId === event.id) { onDelete(event.id); setConfirmId(null) } else setConfirmId(event.id)
                }}>{confirmId === event.id ? 'Confirmar exclusão' : 'Excluir evento'}</button>}
                {confirmId === event.id && <button type="button" disabled={busy} className="ml-2 text-[10px] text-muted-foreground" onClick={() => setConfirmId(null)}>Cancelar</button>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
