import { CalendarClock } from 'lucide-react'

import { upcomingEvents } from '@/data/dashboard'

export function UpcomingEvents() {
  return (
    <section className="rounded-xl border border-[#dcd8eb] bg-white p-4 shadow-[0_1px_3px_rgba(48,36,104,0.04)]">
      <h2 className="text-xs font-bold text-[#302468]">Próximos eventos</h2>

      <div className="mt-2">
        {upcomingEvents.map((event) => (
          <article
            className="flex items-center gap-3 border-b border-[#e5e1ef] py-3 last:border-0 last:pb-1"
            key={event.id}
          >
            <time
              className="grid size-9 shrink-0 place-items-center rounded-md bg-[#f0edf8] text-center text-[#403477]"
              dateTime={`2026-10-${event.day}`}
            >
              <span className="block text-[13px] font-bold leading-3">{event.day}</span>
              <span className="block text-[7px] font-semibold leading-3">{event.month}</span>
            </time>
            <div className="min-w-0">
              <h3 className="truncate text-[10px] font-bold text-[#302468]">{event.title}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-[8px] text-[#8b86a4]">
                <CalendarClock aria-hidden="true" className="size-2.5" />
                {event.schedule}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
