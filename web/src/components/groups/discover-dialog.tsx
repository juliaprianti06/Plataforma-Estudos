import { useEffect, useState, type FormEvent } from 'react'
import { AtSign, Check, Search, Users } from 'lucide-react'
import { matchesGroup, type StudyGroup } from '@/data/groups'
import type { GroupsRepository } from '@/groups/repository'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GroupIcon } from './group-icon'

export function DiscoverDialog({ repository, onClose, onJoin, onJoinByCode }: { repository: GroupsRepository; onClose: () => void; onJoin: (id: string) => Promise<void>; onJoinByCode: (code: string) => Promise<void> }) {
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [query, setQuery] = useState('')
  const [code, setCode] = useState('')
  const [joined, setJoined] = useState<string[]>([])
  const [pending, setPending] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    repository.discover().then((items) => { if (active) setGroups(items) })
      .catch(() => { if (active) setError('Não foi possível carregar os grupos.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [repository])

  async function join(id: string) {
    if (pending) return
    setPending(id)
    setError('')
    try {
      await onJoin(id)
      setJoined((current) => [...current, id])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível adicionar o grupo.')
    } finally { setPending(null) }
  }

  async function enterByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending('invite-code')
    setError('')
    try {
      await onJoinByCode(code)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar no grupo.')
    } finally { setPending(null) }
  }

  const filtered = groups.filter((group) => matchesGroup(group, query))
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl font-bold text-primary">Adicionar grupo</DialogTitle>
          <DialogDescription>Encontre uma comunidade para estudar com você.</DialogDescription>
        </DialogHeader>
        <form onSubmit={enterByCode} aria-busy={pending === 'invite-code'} className="space-y-3 rounded-xl border bg-background/60 p-4">
          <div>
            <h3 className="text-sm font-semibold text-primary">Entrar em um grupo</h3>
            <p id="invite-description" className="mt-1 text-xs leading-relaxed text-muted-foreground">Digite o código da sala que você recebeu.</p>
          </div>
          <fieldset disabled={!!pending} className="min-w-0 space-y-2">
            <label htmlFor="join-group-code" className="text-xs font-medium text-primary">Código da sala</label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <AtSign aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <input
                  id="join-group-code"
                  aria-describedby="invite-description"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  maxLength={12}
                  placeholder="Ex.: RX7K2M"
                  value={code}
                  onChange={(event) => { setCode(event.target.value.toUpperCase()); setError('') }}
                  className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 font-mono text-sm uppercase tracking-wider outline-none focus:border-ring focus:ring-3 focus:ring-ring/10"
                />
              </div>
              <Button type="submit" className="h-10 rounded-full px-5">{pending === 'invite-code' ? 'Entrando...' : 'Entrar'}</Button>
            </div>
          </fieldset>
        </form>
        {error && <p role="alert" className="text-xs text-destructive-text">{error}</p>}
        <label className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input aria-label="Buscar grupos disponíveis" className="h-10 w-full rounded-full border bg-card pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/10" placeholder="Nome, categoria ou assunto..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="space-y-3" aria-busy={loading}>
          {loading ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">Buscando grupos...</p> : filtered.length ? filtered.map((group) => (
            <div key={group.id} className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <GroupIcon name={group.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-primary">{group.name}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground">{group.category} · {group.members + (joined.includes(group.id) ? 1 : 0)} membros</p>
                </div>
              </div>
              <p className="my-3 text-xs leading-relaxed text-muted-foreground">{group.description}</p>
              <Button disabled={!!pending || joined.includes(group.id)} className="w-full rounded-full" variant={joined.includes(group.id) ? 'outline' : 'default'} onClick={() => void join(group.id)}>
                {joined.includes(group.id) ? <><Check /> Adicionado</> : pending === group.id ? 'Adicionando...' : 'Participar do grupo'}
              </Button>
            </div>
          )) : (
            <div className="py-8 text-center text-muted-foreground">
              <Users aria-hidden="true" className="mx-auto mb-3 size-7 opacity-60" />
              <p className="text-sm">{query ? 'Nenhum grupo encontrado.' : 'Você já adicionou todos os grupos disponíveis.'}</p>
              <p className="mt-1 text-xs">{query ? 'Tente outro nome ou assunto.' : 'Você também pode criar seu próprio grupo.'}</p>
            </div>
          )}
        </div>
        <Button variant="outline" className="rounded-full" disabled={!!pending} onClick={onClose}>Voltar aos meus grupos</Button>
      </DialogContent>
    </Dialog>
  )
}
