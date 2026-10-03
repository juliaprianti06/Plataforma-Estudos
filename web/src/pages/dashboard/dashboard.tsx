import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { tasks } from '@/data/dashboard'
import { useAuth } from '@/auth/use-auth'
import type { AuthSession } from '@/auth/types'
import type { StudyGroup } from '@/data/groups'
import { createApiGroupsRepository } from '@/groups/api-repository'
import { createDashboardRepository, type ApiTask, type ApiEvent, type DashboardData, type DashboardNotification } from '@/dashboard/api-repository'
import { defaultTaskFilters, filterTasks } from '@/dashboard/filter-tasks'
import type { DashboardTask, TaskStatus } from '@/data/dashboard'
import { Button } from '@/components/ui/button'
import { TaskDialog } from './task-dialog'
import { EventDialog } from './event-dialog'

import { DashboardHeader } from './dashboard-header'
import { KanbanBoard } from './kanban-board'
import { useLayout } from '@/components/layout/layout-context'
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
  const [disciplines, setDisciplines] = useState<{ id: number; nome: string }[]>([])
  const [loading, setLoading] = useState(remote)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const mutation = useRef(false)
  const [taskDialog, setTaskDialog] = useState<{ task: ApiTask | null } | null>(null)
  const [eventDialog, setEventDialog] = useState<{ event: ApiEvent | null } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!remote) return
    let active = true
    Promise.all([repository.load(), groupsRepository.list(), repository.disciplines()]).then(([nextData, nextGroups, nextDisciplines]) => {
      if (active) { setData(nextData); setGroups(nextGroups.filter(group => !group.archived)); setDisciplines(nextDisciplines); setError(''); setLoading(false) }
    }).catch(cause => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Erro ao carregar seus estudos.'); setLoading(false) }
    })
    return () => { active = false }
  }, [remote, repository, groupsRepository, revision])
  useEffect(() => {
    if (!remote) return
    const update = () => { if (!mutation.current && document.visibilityState === 'visible') setRevision(value => value + 1) }
    const timer = window.setInterval(update, 30000)
    window.addEventListener('focus', update)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update) }
  }, [remote])

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
  async function move(task: DashboardTask, status: TaskStatus) {
    const previous = data
    if (mutation.current || !data) return
    setData({ ...data, tasks: data.tasks.map(item => item.id === task.id ? { ...item, status } : item) })
    try { await mutate(() => repository.moveTask(task.id, status)) }
    catch (cause) { setData(previous); setError(cause instanceof Error ? cause.message : 'Não foi possível mover a tarefa.') }
  }
  function openNotification(item: DashboardNotification) {
    const task = data?.tasks.find(task => task.id === item.taskId)
    const event = data?.events.find(event => event.id === item.eventId)
    if (task?.canEdit) setTaskDialog({ task })
    else if (event?.canEdit) setEventDialog({ event })
    else if (item.groupId !== 'personal') void navigate({ to: '/groups/$groupId', params: { groupId: item.groupId } })
    if (!item.read) run(() => repository.readNotification(item.id))
    setNotificationsOpen(false)
  }
  const adminGroups = groups.filter(group => group.role === 'admin')
  const { openMenu } = useLayout()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredTasks = useMemo(() => {
    const availableTasks = remote ? (data?.tasks ?? []) : tasks
    return filterTasks(availableTasks, { ...defaultTaskFilters, query })
  }, [query, remote, data])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-w-0">
        <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          <DashboardHeader
            notifications={remote ? (data?.notifications ?? []) : undefined}
            notificationItems={data?.notificationItems}
            onNotification={openNotification}
            onRead={item => run(() => repository.readNotification(item.id))}
            notificationsOpen={notificationsOpen}
            onMenuOpen={openMenu}
            onNotificationsToggle={() => setNotificationsOpen((current) => !current)}
            onQueryChange={setQuery}
            query={query}
          />

          {remote && <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button title={groups.length === 0 && disciplines.length === 0 ? 'Crie uma disciplina ou participe de um grupo para adicionar tarefas.' : undefined} disabled={loading || busy || !!error || (groups.length === 0 && disciplines.length === 0)} onClick={() => setTaskDialog({ task: null })}>Nova tarefa</Button>
            <Button title={adminGroups.length === 0 ? 'Você precisa administrar um grupo para agendar eventos.' : undefined} variant="outline" disabled={loading || busy || !!error || adminGroups.length === 0} onClick={() => setEventDialog({ event: null })}>Novo evento</Button>
          </div>}
          {error && <div role="alert" className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-destructive">{error} <Button variant="outline" onClick={refresh}>Tentar novamente</Button></div>}
          {remote && loading ? <p role="status" className="mt-5 text-sm text-muted-foreground">Carregando seus estudos...</p> : (!remote || (data && !error)) && (
            <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <KanbanBoard searching={query.trim().length > 0} tasks={filteredTasks} busy={busy} onMove={remote ? (task, status) => { void move(task, status) } : undefined} onEdit={remote ? task => {
                const selected = data?.tasks.find(item => item.id === task.id)
                if (selected?.canEdit && !busy) setTaskDialog({ task: selected })
              } : undefined} />
              <aside aria-label="Resumo dos estudos" className="space-y-4 xl:pt-[25px]">
                <StudyCard summary={remote ? data?.summary : undefined} busy={busy} onResume={remote ? () => {
                  const task = data?.summary.activeTask
                  if (task) run(() => repository.moveTask(task.id, 'progress'))
                } : undefined} />
                <UpcomingEvents events={remote ? data?.events : undefined} busy={busy} onEdit={remote ? event => setEventDialog({ event }) : undefined} onDelete={remote ? id => run(() => repository.deleteEvent(id)) : undefined} />
              </aside>
            </div>
          )}
          {taskDialog && <TaskDialog task={taskDialog.task} groups={groups} disciplines={disciplines} onClose={() => setTaskDialog(null)} onSave={input => {
            const { groupId, ...fields } = input
            return mutate(() => taskDialog.task ? repository.updateTask(taskDialog.task.id, fields) : repository.createTask({ ...fields, groupId }))
          }} onDelete={() => mutate(() => repository.deleteTask(taskDialog.task!.id))} />}
          {eventDialog && <EventDialog groups={adminGroups} event={eventDialog.event ?? undefined} onClose={() => setEventDialog(null)} onSave={input => mutate(() => eventDialog.event ? repository.updateEvent(eventDialog.event.id, { title: input.title, startsAt: input.startsAt }) : repository.createEvent(input))} />}

        </div>
      </div>
    </div>
  )
}
