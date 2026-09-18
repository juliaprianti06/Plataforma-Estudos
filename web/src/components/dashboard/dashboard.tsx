import { useEffect, useMemo, useRef, useState } from 'react'

import { tasks } from '@/data/dashboard'
import { useAuth } from '@/auth/use-auth'
import type { AuthSession } from '@/auth/types'
import type { StudyGroup } from '@/data/groups'
import { createApiGroupsRepository } from '@/groups/api-repository'
import { createDashboardRepository, taskInput, type ApiTask, type DashboardData } from '@/dashboard/api-repository'
import { Button } from '@/components/ui/button'
import { TaskDialog } from './task-dialog'
import { EventDialog } from './event-dialog'

import { DashboardHeader } from './dashboard-header'
import { KanbanBoard } from './kanban-board'
import { Sidebar } from './sidebar'
import { StudyCard } from './study-card'
import { UpcomingEvents } from './upcoming-events'

export function Dashboard() {
  const session = useAuth()
  return session ? <DashboardContent key={`${session.mode}:${session.user.id}:${session.accessToken}`} session={session} /> : null
}

function DashboardContent({ session }: { session: AuthSession }) {
  const remote = session.mode === 'api'
  const repository = useMemo(() => createDashboardRepository(session), [session])
  const groupsRepository = useMemo(() => createApiGroupsRepository(session), [session])
  const [data, setData] = useState<DashboardData | null>(null)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(remote)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const mutation = useRef(false)
  const [taskDialog, setTaskDialog] = useState<{ task: ApiTask | null } | null>(null)
  const [eventDialog, setEventDialog] = useState(false)

  useEffect(() => {
    if (!remote) return
    let active = true
    Promise.all([repository.load(), groupsRepository.list()]).then(([nextData, nextGroups]) => {
      if (active) { setData(nextData); setGroups(nextGroups); setError(''); setLoading(false) }
    }).catch(cause => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Erro ao carregar seus estudos.'); setLoading(false) }
    })
    return () => { active = false }
  }, [remote, repository, groupsRepository, revision])

  function refresh() { setLoading(true); setError(''); setRevision(value => value + 1) }
  async function mutate(action: () => Promise<unknown>) {
    if (mutation.current) throw new Error('Aguarde a alteração atual.')
    mutation.current = true; setBusy(true)
    try { await action(); refresh() }
    finally { mutation.current = false; setBusy(false) }
  }
  function run(action: () => Promise<unknown>) {
    void mutate(action).catch(cause => setError(cause instanceof Error ? cause.message : 'Erro ao salvar.'))
  }
  const adminGroups = groups.filter(group => group.role === 'admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const messageTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (messageTimer.current !== null) window.clearTimeout(messageTimer.current)
  }, [])

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    const availableTasks = remote ? (data?.tasks ?? []) : tasks
    if (!normalizedQuery) return availableTasks

    return availableTasks.filter((task) =>
      `${task.title} ${task.detail}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
    )
  }, [query, remote, data])

  function handleNavigate(label: string) {
    if (label === 'Início') return
    setMessage(`${label} estará disponível em breve.`)
    if (messageTimer.current !== null) window.clearTimeout(messageTimer.current)
    messageTimer.current = window.setTimeout(() => {
      setMessage('')
      messageTimer.current = null
    }, 2500)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        open={sidebarOpen}
      />

      <main className="min-w-0 flex-1">
        <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <DashboardHeader
            notifications={remote ? (data?.notifications ?? []) : undefined}
            notificationsOpen={notificationsOpen}
            onMenuOpen={() => setSidebarOpen(true)}
            onNotificationsToggle={() => setNotificationsOpen((current) => !current)}
            onQueryChange={setQuery}
            query={query}
          />

          {remote && <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button disabled={loading || busy || !!error || groups.length === 0} onClick={() => setTaskDialog({ task: null })}>Nova tarefa</Button>
            <Button variant="outline" disabled={loading || busy || !!error || adminGroups.length === 0} onClick={() => setEventDialog(true)}>Novo evento</Button>
            <Button variant="ghost" disabled={loading || busy} onClick={refresh}>Atualizar</Button>
            {!loading && !error && groups.length === 0 && <p className="text-xs text-muted-foreground">Entre em um grupo ou crie um na página Grupos para adicionar tarefas.</p>}
            {!loading && !error && groups.length > 0 && adminGroups.length === 0 && <p className="text-xs text-muted-foreground">Administradores podem agendar eventos.</p>}
          </div>}
          {error && <div role="alert" className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-destructive">{error} <Button variant="outline" onClick={refresh}>Tentar novamente</Button></div>}
          {remote && loading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Carregando seus estudos...</p> : (!remote || (data && !error)) && (
            <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <KanbanBoard searching={query.trim().length > 0} tasks={filteredTasks} onEdit={remote ? task => {
                const selected = data?.tasks.find(item => item.id === task.id)
                if (selected?.canEdit && !busy) setTaskDialog({ task: selected })
              } : undefined} />
              <aside aria-label="Resumo dos estudos" className="space-y-4 xl:pt-[25px]">
                <StudyCard summary={remote ? data?.summary : undefined} busy={busy} onResume={remote ? () => {
                  const task = data?.summary.activeTask
                  if (task) run(() => repository.updateTask(task.id, { ...taskInput(task), status: 'progress' }))
                } : undefined} />
                <UpcomingEvents events={remote ? data?.events : undefined} busy={busy} onDelete={remote ? id => run(() => repository.deleteEvent(id)) : undefined} />
              </aside>
            </div>
          )}
          {taskDialog && <TaskDialog task={taskDialog.task} groups={groups} onClose={() => setTaskDialog(null)} onSave={input => {
            const { groupId, ...fields } = input
            return mutate(() => taskDialog.task ? repository.updateTask(taskDialog.task.id, fields) : repository.createTask({ ...fields, groupId }))
          }} onDelete={() => mutate(() => repository.deleteTask(taskDialog.task!.id))} />}
          {eventDialog && <EventDialog groups={adminGroups} onClose={() => setEventDialog(false)} onSave={input => mutate(() => repository.createEvent(input))} />}

        </div>
      </main>

      {message && (
        <div
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xl"
          role="status"
        >
          {message}
        </div>
      )}
    </div>
  )
}
