import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useBlocker } from '@tanstack/react-router'
import { Check, ChevronRight, Menu, Save, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import type { AuthSession } from '@/auth/types'
import { sessionStore } from '@/auth/session'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { getProfileStore, useProfile } from '@/profile/use-profile'
import { profileInput, type UserProfile } from '@/profile/store'
import { AccountPanel } from './account-panel'
import { PreferencesPanel } from './preferences-panel'
import { ProfileForm } from './profile-form'

const tabs = [
  { id: 'profile', label: 'Perfil', detail: 'Como você se apresenta', icon: UserRound },
  { id: 'preferences', label: 'Preferências', detail: 'Seus avisos no painel', icon: SlidersHorizontal },
  { id: 'account', label: 'Conta', detail: 'Acesso e dados pessoais', icon: ShieldCheck },
] as const
type Tab = typeof tabs[number]['id']

export function ProfilePage() {
  const session = useAuth()
  const profile = useProfile()
  return session && profile ? <ProfileContent key={session.mode + session.user.id} session={session} profile={profile} /> : <Navigate to="/" replace />
}

function ProfileContent({ session, profile }: { session: AuthSession; profile: UserProfile }) {
  const [tab, setTab] = useState<Tab>('profile')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draft, setDraft] = useState(() => profileInput(profile))
  const [photoBusy, setPhotoBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(profileInput(profile))
  const store = getProfileStore(session)
  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !!sessionStore.getSnapshot(),
    enableBeforeUnload: () => dirty && !!sessionStore.getSnapshot(),
    withResolver: true,
    disabled: !dirty,
  })

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 4500)
    return () => window.clearTimeout(timer)
  }, [message])

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || saving || photoBusy) return
    setSaving(true)
    setError('')
    try {
      const saved = store.save(draft)
      setDraft(profileInput(saved))
      setMessage('Alterações salvas. Seu perfil está atualizado!')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o perfil.')
    } finally { setSaving(false) }
  }

  function reset() {
    try {
      const restored = store.reset()
      setDraft(profileInput(restored))
      setResetOpen(false)
      setError('')
      setMessage('Personalização restaurada.')
    } catch (cause) {
      setResetOpen(false)
      setError(cause instanceof Error ? cause.message : 'Não foi possível restaurar.')
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={(label) => setMessage(`${label} estará disponível em breve.`)} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1220px] px-4 py-6 sm:px-7 sm:py-8 xl:px-10">
          <header className="mb-7 flex items-start gap-2">
            <Button aria-label="Abrir menu" type="button" variant="ghost" size="icon" className="-ml-2 text-primary lg:hidden" onClick={() => setSidebarOpen(true)}><Menu /></Button>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><span>Minha conta</span><ChevronRight className="size-3" /><span className="text-muted-foreground">Configurações</span></div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Configurações</h1>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Um perfil com a sua cara. Um espaço para aprender do seu jeito.</p>
            </div>
          </header>
          <div className="grid items-start gap-5 xl:grid-cols-[180px_minmax(0,1fr)] xl:gap-7">
            <nav aria-label="Configurações da conta" className="flex gap-1 rounded-2xl border border-border bg-card/60 p-1.5 xl:flex-col xl:gap-2 xl:border-0 xl:bg-transparent xl:p-0">
              {tabs.map(({ id, label, detail, icon: Icon }) => (
                <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} disabled={photoBusy} onClick={() => { setTab(id); setError('') }} className={cn('flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs transition focus-visible:outline-2 focus-visible:outline-ring xl:justify-start', tab === id ? 'bg-muted font-semibold text-accent' : 'text-muted-foreground hover:bg-card')}>
                  <Icon className="size-4 shrink-0" />
                  <span className="text-left">{label}<span className="mt-1 hidden text-[9px] font-normal text-muted-foreground xl:block">{detail}</span></span>
                </button>
              ))}
            </nav>
            <div className="min-w-0">
              <form onSubmit={save} className="overflow-hidden rounded-[20px] border border-border bg-card shadow-sm shadow-primary/10" aria-busy={saving || photoBusy}>
                {tab === 'profile' && <ProfileForm draft={draft} email={session.user.email} onChange={setDraft} onPhotoBusy={setPhotoBusy} />}
                {tab === 'preferences' && <PreferencesPanel draft={draft} onChange={setDraft} />}
                {tab === 'account' && <AccountPanel session={session} profile={profile} onReset={() => setResetOpen(true)} />}
                {error && <p role="alert" className="mx-5 mb-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive-text sm:mx-7">{error}</p>}
                {(tab !== 'account' || dirty) && (
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-5 py-4 sm:px-7">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">{dirty ? <><span className="size-1.5 rounded-full bg-warning" /> Alterações não salvas</> : <><Check className="size-3.5 text-success" /> Tudo atualizado</>}</span>
                    <div className="flex gap-2">
                      {dirty && <Button type="button" variant="ghost" disabled={photoBusy || saving} className="rounded-full text-xs text-muted-foreground" onClick={() => { setDraft(profileInput(profile)); setError('') }}>Descartar</Button>}
                      <Button type="submit" disabled={!dirty || photoBusy || saving} className="h-9 rounded-full px-4 text-xs"><Save className="size-3.5" />{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
                    </div>
                  </footer>
                )}
              </form>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">{profile.updatedAt ? `Última atualização em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(profile.updatedAt))} · ` : ''}Personalização salva neste navegador.</p>
            </div>
          </div>
        </div>
      </main>
      {message && <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-center text-xs text-primary-foreground shadow-lg"><Check className="size-4 shrink-0" />{message}</div>}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="p-6 sm:max-w-md">
          <DialogHeader><DialogTitle>Restaurar personalização?</DialogTitle><DialogDescription>A foto, a apresentação, os interesses e as preferências serão removidos. O nome inicial será restaurado. Seus grupos e seu acesso serão mantidos.</DialogDescription></DialogHeader>
          <div className="mt-2 flex justify-end gap-2"><Button type="button" variant="outline" className="rounded-full" onClick={() => setResetOpen(false)}>Cancelar</Button><Button type="button" className="rounded-full" onClick={reset}>Restaurar perfil</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={blocker.status === 'blocked'} onOpenChange={(open) => { if (!open) blocker.reset?.() }}>
        <DialogContent className="p-6 sm:max-w-md">
          <DialogHeader><DialogTitle>Sair sem salvar?</DialogTitle><DialogDescription>Você tem alterações pendentes no perfil. Se sair agora, elas serão descartadas.</DialogDescription></DialogHeader>
          <div className="mt-2 flex justify-end gap-2"><Button type="button" variant="outline" className="rounded-full" onClick={() => blocker.reset?.()}>Continuar editando</Button><Button type="button" className="rounded-full" onClick={() => blocker.proceed?.()}>Sair sem salvar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
