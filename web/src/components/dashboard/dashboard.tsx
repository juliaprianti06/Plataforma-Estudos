import { useMemo, useState } from 'react'

import { tasks } from '@/data/dashboard'

import { DashboardHeader } from './dashboard-header'
import { KanbanBoard } from './kanban-board'
import { Sidebar } from './sidebar'
import { StudyCard } from './study-card'
import { UpcomingEvents } from './upcoming-events'

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalizedQuery) return tasks

    return tasks.filter((task) =>
      `${task.title} ${task.detail}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
    )
  }, [query])

  function handleNavigate(label: string) {
    if (label === 'Início') return
    setMessage(`${label} estará disponível em breve.`)
    window.setTimeout(() => setMessage(''), 2500)
  }

  return (
    <div className="flex min-h-screen bg-[#f7f6fc] text-[#2f2850]">
      <Sidebar
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        open={sidebarOpen}
      />

      <main className="min-w-0 flex-1">
        <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <DashboardHeader
            notificationsOpen={notificationsOpen}
            onMenuOpen={() => setSidebarOpen(true)}
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
      </main>

      {message && (
        <div
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#302468] px-4 py-2 text-xs font-medium text-white shadow-xl"
          role="status"
        >
          {message}
        </div>
      )}
    </div>
  )
}
