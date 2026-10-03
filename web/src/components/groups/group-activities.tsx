import { useMemo, useState } from 'react'
import type { AuthSession } from '@/auth/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { createDashboardRepository, type ApiEvent, type ApiTask } from '@/dashboard/api-repository'
import { createWorkspaceRepository, type GroupMember, type GroupWorkspace } from '@/groups/workspace-repository'
import { TaskDialog } from '@/pages/dashboard/task-dialog'
import { EventDialog } from '@/pages/dashboard/event-dialog'
import { KanbanBoard } from '@/pages/dashboard/kanban-board'
import { UpcomingEvents } from '@/pages/dashboard/upcoming-events'

export function GroupActivities({ data, session, busy, onClose, onMutation }: {
  data: GroupWorkspace; session: AuthSession; busy: boolean; onClose: () => void
  onMutation: (action: () => Promise<unknown>) => Promise<void>
}) {
  const dashboard = useMemo(() => createDashboardRepository(session), [session])
  const repository = useMemo(() => createWorkspaceRepository(session, data.group.id), [session, data.group.id])
  const [tab, setTab] = useState<'tasks' | 'events'>('tasks')
  const [taskEditor, setTaskEditor] = useState<{ task: ApiTask | null } | null>(null)
  const [eventEditor, setEventEditor] = useState<{ event: ApiEvent | null } | null>(null)
  const [error, setError] = useState('')
  const writable = !data.group.archived && !busy
  const admin = data.group.role === 'admin'
  function run(action: () => Promise<unknown>) {
    setError('')
    void onMutation(action).catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'))
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl" showCloseButton={!busy}>
    <DialogTitle>Tarefas e eventos</DialogTitle><DialogDescription>Planejamento do grupo {data.group.name}.</DialogDescription>
    <div className="flex gap-2"><Button variant={tab === 'tasks' ? 'default' : 'outline'} onClick={() => setTab('tasks')}>Tarefas</Button><Button variant={tab === 'events' ? 'default' : 'outline'} onClick={() => setTab('events')}>Eventos</Button></div>
    {error && <p role="alert" className="text-xs text-destructive-text">{error}</p>}
    {tab === 'tasks' && <div className="space-y-4">
      <Button disabled={!writable} onClick={() => setTaskEditor({ task: null })}>Nova tarefa do grupo</Button>
      <KanbanBoard tasks={data.tasks} searching={false} busy={busy} onEdit={task => { const selected = data.tasks.find(item => item.id === task.id); if (selected) setTaskEditor({ task: selected }) }} onMove={(task, status) => run(() => dashboard.moveTask(task.id, status))} />
      {data.tasks.map(task => <article key={task.id} className="space-y-3 rounded-xl border border-border p-4"><h2 className="text-sm font-semibold text-primary">{task.title}</h2><Assignees key={`${task.id}:${(data.responsibilities[task.id] ?? []).join(',')}`} members={data.members} selected={data.responsibilities[task.id] ?? []} editable={admin && writable} onSave={ids => onMutation(() => repository.assign(task.id, ids))} /></article>)}
    </div>}
    {tab === 'events' && <div className="space-y-4">{admin && <Button disabled={!writable} onClick={() => setEventEditor({ event: null })}>Novo evento</Button>}<UpcomingEvents events={data.events} busy={busy} onEdit={event => setEventEditor({ event })} onDelete={id => run(() => dashboard.deleteEvent(id))} /></div>}
    {taskEditor && <TaskDialog allowPersonal={false} groups={[data.group]} task={taskEditor.task} onClose={() => setTaskEditor(null)} onSave={input => { const { groupId, ...fields } = input; return onMutation(() => taskEditor.task ? dashboard.updateTask(taskEditor.task.id, fields) : dashboard.createTask({ ...fields, groupId })) }} onDelete={() => onMutation(() => dashboard.deleteTask(taskEditor.task!.id))} />}
    {eventEditor && <EventDialog groups={[data.group]} event={eventEditor.event ?? undefined} onClose={() => setEventEditor(null)} onSave={input => onMutation(() => eventEditor.event ? dashboard.updateEvent(eventEditor.event.id, { title: input.title, startsAt: input.startsAt }) : dashboard.createEvent(input))} />}
  </DialogContent></Dialog>
}

function Assignees({ members, selected, editable, onSave }: { members: GroupMember[]; selected: number[]; editable: boolean; onSave: (ids: number[]) => Promise<void> }) {
  const [ids, setIds] = useState(selected)
  const [error, setError] = useState('')
  if (!editable) return <p className="text-xs text-muted-foreground">Responsáveis: {members.filter(member => selected.includes(member.id)).map(member => member.name).join(', ') || 'Nenhum responsável'}</p>
  return <form className="space-y-2" onSubmit={event => { event.preventDefault(); setError(''); void onSave(ids).catch(cause => setError(cause.message)) }}><fieldset><legend className="text-xs font-semibold">Responsáveis</legend><div className="mt-2 flex flex-wrap gap-3">{members.map(member => <label key={member.id} className="flex items-center gap-1 text-xs"><input type="checkbox" checked={ids.includes(member.id)} onChange={e => setIds(current => e.target.checked ? [...current, member.id] : current.filter(id => id !== member.id))} />{member.name}</label>)}</div></fieldset>{error && <p role="alert" className="text-destructive-text">{error}</p>}<Button type="submit" variant="outline" disabled={!ids.length || JSON.stringify(ids) === JSON.stringify(selected)}>Salvar responsáveis</Button></form>
}
