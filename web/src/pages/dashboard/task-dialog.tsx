import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { StudyGroup } from '@/data/groups'
import type { ApiTask, TaskInput } from '@/dashboard/api-repository'

const field = 'mt-1 w-full rounded-md border border-border bg-background p-2 text-sm text-foreground focus:outline-ring'
function localDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
export function TaskDialog({ task, groups, disciplines = [], allowPersonal = true, onSave, onClose }: {
  task: ApiTask | null; groups: StudyGroup[]; disciplines?: { id: number; nome: string }[]; onSave: (input: TaskInput & { groupId: string | null }) => Promise<void>
  onClose: () => void; allowPersonal?: boolean
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [groupId, setGroupId] = useState(task?.groupId ?? groups[0]?.id ?? '')
  const [personal, setPersonal] = useState(task ? task.groupId === 'personal' : groups.length === 0)
  const [disciplineId, setDisciplineId] = useState(task?.disciplineId ?? disciplines[0]?.id ?? null)
  const [status, setStatus] = useState<TaskInput['status']>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<TaskInput['priority']>(task?.priority ?? 'medium')
  const [dueAt, setDueAt] = useState(localDate(task?.dueAt ?? null))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function perform(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action(); onClose() } catch (cause) { setError(cause instanceof Error ? cause.message : 'N\u00e3o foi poss\u00edvel salvar.') }
    finally { setBusy(false) }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
      <DialogTitle>{task ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
      <DialogDescription>{personal ? 'Organize sua atividade e seu prazo de estudo.' : 'Organize as atividades do grupo. Quem cria a tarefa fica responsável por ela.'}</DialogDescription>
      <form onSubmit={event => { event.preventDefault(); void perform(() => onSave({ title: title.trim(), description, groupId: personal ? null : groupId, status, priority, dueAt: dueAt ? new Date(dueAt).toISOString() : null, disciplineId: personal ? disciplineId : task?.disciplineId ?? null })) }}>
        <fieldset disabled={busy} className="space-y-3">
          {!task && allowPersonal && <label className="block">Tipo de tarefa<select className={field} value={personal ? 'personal' : 'group'} onChange={e => setPersonal(e.target.value === 'personal')}><option value="personal">Pessoal</option><option value="group" disabled={!groups.length}>Do grupo</option></select></label>}
          {personal ? <label className="block">Disciplina<select className={field} value={disciplineId ?? ''} onChange={e => setDisciplineId(Number(e.target.value))} required>{task && !disciplines.some(d => d.id === task.disciplineId) && <option value={task.disciplineId ?? ''}>{task.groupName}</option>}{disciplines.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></label> : <label className="block">Grupo<select className={field} value={groupId} onChange={e => setGroupId(e.target.value)} disabled={!!task} required>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
          <label className="block">Título<input className={field} value={title} onChange={e => setTitle(e.target.value)} minLength={personal ? 1 : 3} maxLength={personal ? undefined : 150} required /></label>
          <label className="block">Descrição<textarea className={field} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label>Status<select className={field} value={status} onChange={e => setStatus(e.target.value as TaskInput['status'])}><option value="todo">A fazer</option><option value="progress">Em andamento</option><option value="done">Concluído</option></select></label>
            <label>Prioridade<select className={field} value={priority} onChange={e => setPriority(e.target.value as TaskInput['priority'])}><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label>
          </div>
          <label className="block">Prazo (opcional)<input className={field} type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} /></label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={(personal ? !disciplineId : !groupId) || title.trim().length < (personal ? 1 : 3)}>{busy ? 'Salvando...' : 'Salvar tarefa'}</Button>
          </div>
        </fieldset>
      </form>
    </DialogContent>
  </Dialog>
}
