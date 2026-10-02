import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { StudyGroup } from '@/data/groups'
import type { EventInput } from '@/dashboard/api-repository'

export function EventDialog({ groups, onSave, onClose }: { groups: StudyGroup[]; onSave: (input: EventInput) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [startsAt, setStartsAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = 'mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground focus:outline-ring'
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}><DialogContent showCloseButton={!busy}>
    <DialogTitle>Novo evento</DialogTitle>
    <DialogDescription>Agende um encontro para os membros do grupo.</DialogDescription>
    <form onSubmit={async event => {
      event.preventDefault(); setError('')
      if (new Date(startsAt).getTime() <= Date.now()) { setError('Escolha uma data futura.'); return }
      setBusy(true)
      try { await onSave({ title: title.trim(), groupId, startsAt: new Date(startsAt).toISOString() }); onClose() }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Erro ao salvar evento.') }
      finally { setBusy(false) }
    }}><fieldset disabled={busy} className="space-y-3">
      <label className="block">Grupo<select className={field} value={groupId} onChange={e => setGroupId(e.target.value)} required>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
      <label className="block">Título<input className={field} value={title} onChange={e => setTitle(e.target.value)} minLength={3} maxLength={150} required /></label>
      <label className="block">Data e horário<input className={field} type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} required /></label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!groupId || title.trim().length < 3}>{busy ? 'Salvando...' : 'Criar evento'}</Button></div>
    </fieldset></form>
  </DialogContent></Dialog>
}
