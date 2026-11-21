import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { AuthSession } from '@/auth/types'
import { Button } from '@/components/ui/button'
import { createDashboardRepository, type ApiEvent, type ApiTask } from '@/dashboard/api-repository'
import { createWorkspaceRepository, type GroupMember, type GroupWorkspace } from '@/groups/workspace-repository'
import { TaskDialog } from '@/pages/dashboard/task-dialog'
import { EventDialog } from '@/pages/dashboard/event-dialog'
import { KanbanBoard } from '@/pages/dashboard/kanban-board'
import { UpcomingEvents } from '@/pages/dashboard/upcoming-events'

export function GroupActivities({ data, session, busy, onMutation }: {
  data: GroupWorkspace; session: AuthSession; busy: boolean
  onMutation: (action: () => Promise<unknown>) => Promise<void>
}) {
  const dashboard = useMemo(() => createDashboardRepository(session), [session])
  const repository = useMemo(() => createWorkspaceRepository(session, data.group.id), [session, data.group.id])
  const [taskEditor, setTaskEditor] = useState<{ task: ApiTask | null } | null>(null)
  const [eventEditor, setEventEditor] = useState<{ event: ApiEvent | null } | null>(null)
  const [error, setError] = useState('')
  const writable = !data.group.archived && !busy
  const admin = data.group.role === 'admin'
  function run(action: () => Promise<unknown>) {
    setError('')
    void onMutation(action).catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'))
  }
  return <section aria-label="Kanban do grupo" className="space-y-5">
    {error && <p role="alert" className="text-xs text-destructive-text">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{data.tasks.length} {data.tasks.length === 1 ? 'tarefa no grupo' : 'tarefas no grupo'}. Arraste os cartões para atualizar o andamento.</p>
          <Button disabled={!writable} className="text-xs" onClick={() => setTaskEditor({ task: null })}><Plus className="size-3.5" />Nova tarefa do grupo</Button>
        </div>
        <KanbanBoard expanded emptyHint="Crie a primeira tarefa do grupo para começar." tasks={data.tasks} searching={false} busy={busy} onEdit={task => { const selected = data.tasks.find(item => item.id === task.id); if (selected) setTaskEditor({ task: selected }) }} onMove={(task, status) => run(() => dashboard.moveTask(task.id, status))} />
      </div>
      <aside aria-label="Eventos do grupo" className="space-y-3 xl:pt-[25px]">
        {admin && <Button variant="outline" disabled={!writable} className="w-full text-xs" onClick={() => setEventEditor({ event: null })}><Plus className="size-3.5" />Novo evento</Button>}
        <UpcomingEvents events={data.events} busy={busy} onEdit={event => setEventEditor({ event })} onDelete={id => run(() => dashboard.deleteEvent(id))} />
      </aside>
    </div>
    {data.tasks.length > 0 && <section aria-labelledby="group-responsibles" className="space-y-3">
      <h2 id="group-responsibles" className="text-[13px] font-bold text-primary">Responsáveis</h2>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {data.tasks.map(task => <article key={task.id} className="space-y-2 p-4"><h3 className="text-xs font-semibold text-primary [overflow-wrap:anywhere]">{task.title}</h3><Assignees key={`${task.id}:${(data.responsibilities[task.id] ?? []).join(',')}`} members={data.members} selected={data.responsibilities[task.id] ?? []} editable={admin && writable} onSave={ids => onMutation(() => repository.assign(task.id, ids))} /></article>)}
      </div>
    </section>}
    {taskEditor && <TaskDialog allowPersonal={false} groups={[data.group]} task={taskEditor.task} onClose={() => setTaskEditor(null)} onSave={input => { const { groupId, ...fields } = input; return onMutation(() => taskEditor.task ? dashboard.updateTask(taskEditor.task.id, fields) : dashboard.createTask({ ...fields, groupId })) }} onDelete={() => onMutation(() => dashboard.deleteTask(taskEditor.task!.id))} />}
    {eventEditor && <EventDialog groups={[data.group]} event={eventEditor.event ?? undefined} onClose={() => setEventEditor(null)} onSave={input => onMutation(() => eventEditor.event ? dashboard.updateEvent(eventEditor.event.id, { title: input.title, startsAt: input.startsAt }) : dashboard.createEvent(input))} />}
  </section>
}

function Assignees({ members, selected, editable, onSave }: { members: GroupMember[]; selected: number[]; editable: boolean; onSave: (ids: number[]) => Promise<void> }) {
  const [ids, setIds] = useState(selected)
  const [error, setError] = useState('')
  if (!editable) return <p className="text-xs text-muted-foreground">Responsáveis: {members.filter(member => selected.includes(member.id)).map(member => member.name).join(', ') || 'Nenhum responsável'}</p>
  return <form className="space-y-2" onSubmit={event => { event.preventDefault(); setError(''); void onSave(ids).catch(cause => setError(cause.message)) }}><fieldset><legend className="sr-only">Responsáveis</legend><div className="flex flex-wrap gap-3">{members.map(member => <label key={member.id} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={ids.includes(member.id)} onChange={e => setIds(current => e.target.checked ? [...current, member.id] : current.filter(id => id !== member.id))} />{member.name}</label>)}</div></fieldset>{error && <p role="alert" className="text-destructive-text">{error}</p>}<Button type="submit" variant="outline" size="sm" className="text-xs" disabled={!ids.length || JSON.stringify(ids) === JSON.stringify(selected)}>Salvar responsáveis</Button></form>
}
