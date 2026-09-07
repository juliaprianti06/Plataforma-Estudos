import { useMemo, useState } from 'react'
import { tasks } from '@/data/dashboard'
import { DashboardHeader } from './dashboard-header'
import { KanbanBoard } from './kanban-board'
import { StudyCard } from './study-card'
import { UpcomingEvents } from './upcoming-events'
import { useLayout } from '../layout/app-layout'

export function Dashboard() {
  const { openMenu } = useLayout()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalizedQuery) return tasks

    return tasks.filter((task) =>
      `${task.title} ${task.detail}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
    )
  }, [query])

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <DashboardHeader
        notificationsOpen={notificationsOpen}
        onMenuOpen={openMenu}
        onNotificationsToggle={() => setNotificationsOpen((current) => !current)}
        onQueryChange={setQuery}
        query={query}
      />

      <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <KanbanBoard searching={query.trim().length > 0} tasks={filteredTasks} />
        <aside aria-label="Resumo dos estudos" className="space-y-4 xl:pt-[25px]">
          <StudyCard />
          <UpcomingEvents />
        </aside>
      </div>
    </div>
  )
}