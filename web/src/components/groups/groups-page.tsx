import { useEffect, useMemo, useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { Menu, Plus, Search, Users, X } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { matchesGroup, type GroupInput, type StudyGroup } from '@/data/groups'
import { createLocalGroupsRepository } from '@/groups/repository'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { GroupCard } from './group-card'
import { GroupDialog } from './group-dialog'
import { DiscoverDialog } from './discover-dialog'

export function GroupsPage() {
  const session = useAuth()
  return session ? <GroupsContent key={session.user.id} userId={session.user.id} demo={session.mode === 'mock'} /> : <Navigate to="/" replace />
}

function GroupsContent({ userId, demo }: { userId: string; demo: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<StudyGroup | 'new' | null>(null)
  const [discover, setDiscover] = useState(false)
  const repository = useMemo(() => createLocalGroupsRepository(userId, {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }, demo), [userId, demo])

  useEffect(() => {
    let active = true
    repository.list().then((items) => { if (active) setGroups(items) })
      .catch(() => { if (active) setError('Não foi possível carregar os grupos. Recarregue a página para tentar novamente.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [repository])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 3500)
    return () => window.clearTimeout(timer)
  }, [message])

  async function save(input: GroupInput, id?: string, inviteCode?: string) {
    const group = id ? await repository.update(id, input) : await repository.create(input, inviteCode)
    setGroups((current) => id ? current.map((item) => item.id === id ? group : item) : [...current, group])
    setQuery('')
    setMessage(id ? 'Grupo atualizado com sucesso.' : 'Seu grupo está pronto. Bons estudos!')
  }

  async function join(id: string, byCode = false) {
    const group = byCode ? await repository.joinByCode(id) : await repository.join(id)
    setGroups((current) => [...current, group])
    setQuery('')
    setMessage('Grupo adicionado aos seus estudos.')
  }

  const filtered = groups.filter((group) => matchesGroup(group, query))
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={(label) => setMessage(`${label} estará disponível em breve.`)} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 xl:px-8">
          <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-2">
              <Button aria-label="Abrir menu" variant="ghost" size="icon" className="-ml-2 text-primary lg:hidden" onClick={() => setSidebarOpen(true)}><Menu /></Button>
              <div>
                <h1 className="text-[22px] font-bold tracking-[-0.025em] text-primary">Grupos</h1>
                <p className="mt-1 text-xs text-muted-foreground">Seus grupos de estudo</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="relative w-full sm:w-[190px]">
                <span className="sr-only">Buscar grupo</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input type="search" placeholder="Buscar grupo..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 w-full rounded-full border border-border bg-card pl-9 pr-8 text-[11px] text-primary outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/10 [&::-webkit-search-cancel-button]:appearance-none" />
                {query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>}
              </label>
              <Button variant="outline" className="h-9 flex-1 rounded-full border-accent/30 bg-transparent px-3 text-[11px] text-accent sm:flex-none" onClick={() => setDiscover(true)}><Plus className="size-3.5" /> Adicionar grupo</Button>
              <Button className="h-9 flex-1 rounded-full bg-primary px-4 text-[11px] sm:flex-none" onClick={() => setEditor('new')}>Criar grupo</Button>
            </div>
          </header>
          {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-text">{error}</p>}
          {loading ? (
            <p role="status" className="py-16 text-center text-sm text-muted-foreground">Carregando seus grupos...</p>
          ) : filtered.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Seus grupos de estudo">
              {filtered.map((group) => <GroupCard key={group.id} group={group} onOpen={setEditor} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
              <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground"><Users className="size-7" /></span>
              <h2 className="text-base font-semibold text-primary">{query ? 'Nenhum grupo encontrado' : 'Seu próximo grupo começa aqui'}</h2>
              <p className="mb-5 mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{query ? 'Tente buscar por outro nome, categoria ou assunto.' : 'Crie um grupo e transforme seus estudos em uma experiência compartilhada.'}</p>
              <Button variant="outline" className="rounded-full px-4" onClick={() => query ? setQuery('') : setEditor('new')}>{query ? 'Limpar busca' : 'Criar meu primeiro grupo'}</Button>
            </div>
          )}
          <span role="status" className="sr-only">{!loading && query ? `${filtered.length} grupos encontrados.` : ''}</span>
        </div>
      </main>
      {editor && <GroupDialog group={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSave={save} />}
      {discover && <DiscoverDialog repository={repository} onClose={() => setDiscover(false)} onJoin={join} onJoinByCode={(code) => join(code, true)} />}
      {message && <div role="status" className="fixed bottom-5 left-1/2 z-[60] w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-primary px-5 py-3 text-center text-xs text-primary-foreground shadow-lg">{message}</div>}
    </div>
  )
}
