import { useState, type FormEvent } from 'react'
import { groupCategories, groupIcons, type GroupCategory, type GroupIcon as IconName, type GroupInput, type StudyGroup } from '@/data/groups'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { GroupIcon } from './group-icon'
import { InviteCode } from './invite-code'
import { generateInviteCode } from '@/groups/invite-code'

const fieldClass = 'w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/10'
const iconLabels = { react: 'Átomo', pencil: 'Lápis', laptop: 'Computador', math: 'Matemática', phone: 'Celular', robot: 'Robô' }

type GroupDialogProps = {
  group?: StudyGroup
  onClose: () => void
  onSave: (input: GroupInput, id?: string, inviteCode?: string) => Promise<void>
}

export function GroupDialog({ group, onClose, onSave }: GroupDialogProps) {
  const [icon, setIcon] = useState<IconName>(group?.icon ?? 'react')
  const [inviteCode] = useState(() => group?.inviteCode ?? generateInviteCode())
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const readOnly = group?.role === 'member'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || readOnly) return
    const data = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      await onSave({
        name: String(data.get('name') ?? ''),
        description: String(data.get('description') ?? ''),
        category: String(data.get('category')) as GroupCategory,
        icon,
      }, group?.id, inviteCode)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o grupo.')
    } finally { setPending(false) }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl font-bold text-primary">{readOnly ? group.name : group ? 'Editar grupo' : 'Criar grupo'}</DialogTitle>
          <DialogDescription>
            {readOnly ? 'Um espaço para aprender e evoluir em comunidade.' : group ? 'Mantenha as informações do seu grupo em dia.' : 'Reúna pessoas e dê o próximo passo nos estudos.'}
          </DialogDescription>
        </DialogHeader>
        {readOnly ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3"><GroupIcon name={group.icon} /><span className="text-sm text-muted-foreground">{group.category} · {group.members} membros</span></div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{group.description}</p>
            <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">Você participa como membro. As informações são editadas pelos administradores.</p>
            <InviteCode code={inviteCode} />
            <Button className="w-full rounded-full" onClick={onClose}>Voltar aos grupos</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} aria-busy={pending}>
            <fieldset disabled={pending} className="min-w-0 space-y-4 disabled:opacity-60">
              <div className="space-y-2">
                <span id="group-icon-label" className="text-xs font-semibold text-primary">Ícone do grupo</span>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="group-icon-label">
                  {groupIcons.map((value) => (
                    <button type="button" key={value} aria-label={iconLabels[value]} aria-pressed={icon === value} onClick={() => setIcon(value)} className={cn('rounded-xl p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring', icon === value && 'ring-2 ring-accent ring-offset-2 ring-offset-popover')}>
                      <GroupIcon name={value} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="group-name" className="text-xs font-semibold text-primary">Nome do grupo</label>
                <input autoFocus id="group-name" name="name" className={fieldClass} placeholder="Ex.: Clube de estudos de React" defaultValue={group?.name} required minLength={3} maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="group-category" className="text-xs font-semibold text-primary">Categoria</label>
                <select id="group-category" name="category" className={fieldClass} defaultValue={group?.category ?? 'Programação'}>
                  {groupCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="group-description" className="text-xs font-semibold text-primary">Descrição</label>
                <textarea id="group-description" name="description" rows={3} className={cn(fieldClass, 'resize-none')} placeholder="O que vocês vão estudar juntos?" defaultValue={group?.description} required minLength={10} maxLength={240} />
                <p className="text-[10px] text-muted-foreground">Entre 10 e 240 caracteres.</p>
              </div>
              <InviteCode code={inviteCode} draft={!group} />
              {error && <p role="alert" className="text-xs text-destructive-text">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="rounded-full px-4" onClick={onClose}>Cancelar</Button>
                <Button type="submit" className="rounded-full px-5">{pending ? 'Salvando...' : group ? 'Salvar alterações' : 'Criar grupo'}</Button>
              </div>
            </fieldset>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
