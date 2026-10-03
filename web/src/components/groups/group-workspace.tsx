import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { FileText, Menu, MoreHorizontal, Plus } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import type { AuthSession } from '@/auth/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createWorkspaceRepository, type GroupFeed, type GroupMember, type GroupWorkspace, type SharedMaterial } from '@/groups/workspace-repository'
import { createApiGroupsRepository } from '@/groups/api-repository'
import { formatMaterialSize, initials } from '@/groups/format-activity'
import { useLayout } from '@/components/layout/layout-context'
import { cn } from '@/lib/utils'
import { GroupDialog } from './group-dialog'
import { InviteCode } from './invite-code'
import { MemberAvatar } from './member-avatar'
import { GroupFeedPanel } from './group-feed'
import { GroupMembersPanel } from './group-members'
import { GroupActivities } from './group-activities'

const tabs = [{ id: 'feed', label: 'Feed' }, { id: 'members', label: 'Membros' }, { id: 'materials', label: 'Materiais' }] as const
type Tab = typeof tabs[number]['id']
type Confirmation = { title: string; description: string; action: () => Promise<unknown>; destructive?: boolean; navigateAway?: boolean }

export function GroupWorkspacePage({ groupId }: { groupId: string }) {
  const session = useAuth()
  return session ? <Workspace key={`${groupId}:${session.user.id}:${session.accessToken}`} groupId={groupId} session={session} /> : null
}

function Workspace({ groupId, session }: { groupId: string; session: AuthSession }) {
  const repository = useMemo(() => createWorkspaceRepository(session, groupId), [session, groupId])
  const groupRepository = useMemo(() => createApiGroupsRepository(session), [session])
  const [data, setData] = useState<GroupWorkspace | null>(null)
  const [feed, setFeed] = useState<GroupFeed>({ items: [], nextCursor: null })
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const mutation = useRef(false)
  const [tab, setTab] = useState<Tab>('feed')
  const [groupEditor, setGroupEditor] = useState(false)
  const [activitiesOpen, setActivitiesOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [ownMaterials, setOwnMaterials] = useState<SharedMaterial[]>([])
  const [sharing, setSharing] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [confirmationError, setConfirmationError] = useState('')
  const navigate = useNavigate()
  const { openMenu } = useLayout()
  function refresh() { setRevision(value => value + 1) }

  useEffect(() => {
    let active = true
    Promise.all([repository.load(), repository.feed()]).then(([workspace, activities]) => {
      if (active) { setData(workspace); setFeed(activities); setError('') }
    }).catch(cause => { if (active) { setError(cause instanceof Error ? cause.message : 'Erro ao carregar o grupo.'); setData(null) } })
    return () => { active = false }
  }, [repository, revision])
  useEffect(() => {
    const update = () => { if (!mutation.current && document.visibilityState === 'visible') setRevision(value => value + 1) }
    const timer = window.setInterval(update, 30000)
    window.addEventListener('focus', update)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function mutate(action: () => Promise<unknown>, refreshAfter = true) {
    if (mutation.current) throw new Error('Aguarde a operação atual.')
    mutation.current = true; setBusy(true); setError('')
    try { await action(); if (refreshAfter) refresh() }
    finally { mutation.current = false; setBusy(false) }
  }
  function run(action: () => Promise<unknown>) { void mutate(action).catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.')) }
  function confirm(value: Confirmation) { setConfirmationError(''); setConfirmation(value) }
  async function applyConfirmation() {
    if (!confirmation) return
    setConfirmationError('')
    try { await mutate(confirmation.action, !confirmation.navigateAway); setConfirmation(null) }
    catch (cause) { setConfirmationError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.') }
  }
  async function loadMore() {
    const before = feed.nextCursor
    if (before === null || loadingMore) return
    setLoadingMore(true)
    try {
      const next = await repository.feed(before)
      setFeed(current => current.nextCursor === before ? { items: [...current.items, ...next.items.filter(item => !current.items.some(previous => previous.id === item.id))], nextCursor: next.nextCursor } : current)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar mais atividades.') }
    finally { setLoadingMore(false) }
  }
  async function download(id: number) {
    const material = data?.materials.find(item => item.id_material === id)
    const blob = await repository.download(id)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const title = material?.titulo ?? 'material'
    const suffix = material?.url_arquivo.match(/\.[a-z0-9]+$/i)?.[0] ?? ''
    anchor.href = url; anchor.download = title.toLowerCase().endsWith(suffix.toLowerCase()) ? title : title + suffix
    document.body.appendChild(anchor); anchor.click(); anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function copyCode() {
    if (!data) return
    try { await navigator.clipboard.writeText(data.group.inviteCode); setNotice('Código do grupo copiado!') }
    catch { setInviteOpen(true); setNotice('Selecione o código do grupo para copiar manualmente.') }
  }
  function changeRole(member: GroupMember) {
    confirm({ title: 'Alterar permissão?', description: `${member.name} passará a ser ${member.role === 'admin' ? 'membro' : 'administrador'}.`, action: () => repository.role(member.id, member.role === 'admin' ? 'member' : 'admin') })
  }
  function removeMember(member: GroupMember) {
    confirm({ title: 'Remover membro?', description: `${member.name} perderá o acesso a este grupo.`, destructive: true, action: () => repository.remove(member.id) })
  }

  const group = data?.group
  const admin = group?.role === 'admin'
  const writable = !!group && !group.archived && !busy
  const availableMaterials = ownMaterials.filter(item => !data?.materials.some(shared => shared.id_material === item.id_material))
  return <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
    <div className="flex items-center gap-2"><Button aria-label="Abrir menu" variant="ghost" size="icon" className="lg:hidden" onClick={openMenu}><Menu /></Button><Link to="/groups" className="text-xs text-muted-foreground hover:text-accent">← Todos os grupos</Link></div>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive-text">{error} <Button variant="outline" onClick={refresh}>Tentar novamente</Button></div>}
    {!data && !error && <p role="status" className="text-sm text-muted-foreground">Carregando grupo...</p>}
    {group && data && <>
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-sm font-semibold text-white">{initials(group.name)}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h1 className="text-base leading-tight font-semibold text-primary [overflow-wrap:anywhere]">{group.name}</h1><span className="rounded bg-muted px-2 py-1 text-[9px] text-accent">{group.category}</span>{group.private && <span className="text-[9px] text-muted-foreground">Privado</span>}</div><p className="mt-1 text-[10px] text-muted-foreground">{group.members} {group.members === 1 ? 'membro' : 'membros'}</p></div></div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div aria-label="Participantes do grupo" className="hidden -space-x-2 sm:flex">{data.members.slice(0, 4).map(person => <MemberAvatar key={person.id} person={person} className="size-7 ring-2 ring-card" />)}{data.members.length > 4 && <span className="relative grid size-7 place-items-center rounded-full bg-muted text-[9px] font-semibold text-accent ring-2 ring-card">+{data.members.length - 4}</span>}</div>
          <Button variant="outline" className="border-accent text-xs text-accent hover:bg-muted" disabled={!writable} onClick={() => setInviteOpen(true)}><Plus className="size-3.5" />Convidar</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-muted text-muted-foreground" aria-label="Ações do grupo" disabled={busy}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="min-w-52 rounded-xl border-border bg-card p-1">
            <DropdownMenuItem disabled={!writable} className="py-2 text-xs" onSelect={() => { void copyCode() }}>Copiar código do grupo</DropdownMenuItem>
            {admin && <DropdownMenuItem disabled={!writable} className="py-2 text-xs" onSelect={() => setGroupEditor(true)}>Editar grupo<span className="ml-auto text-[9px] text-muted-foreground">Admin</span></DropdownMenuItem>}
            <DropdownMenuItem className="py-2 text-xs" onSelect={() => setActivitiesOpen(true)}>Tarefas e eventos</DropdownMenuItem>
            <DropdownMenuItem className="py-2 text-xs" onSelect={refresh}>Atualizar atividades</DropdownMenuItem>
            {admin && <DropdownMenuItem className="py-2 text-xs" onSelect={() => confirm({ title: group.archived ? 'Reativar grupo?' : 'Arquivar grupo?', description: 'Os dados serão preservados. Grupos arquivados ficam disponíveis apenas para consulta.', action: () => repository.archive(!group.archived) })}>{group.archived ? 'Reativar grupo' : 'Arquivar grupo'}<span className="ml-auto text-[9px] text-muted-foreground">Admin</span></DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="py-2 text-xs" onSelect={() => confirm({ title: 'Sair do grupo?', description: 'Você perderá o acesso ao grupo. Se for o último administrador de um grupo ativo, promova outra pessoa ou arquive o grupo primeiro.', destructive: true, navigateAway: true, action: async () => { await repository.leave(); await navigate({ to: '/groups' }) } })}>Sair do grupo</DropdownMenuItem>
            {admin && <DropdownMenuItem variant="destructive" className="py-2 text-xs" onSelect={() => confirm({ title: 'Excluir grupo?', description: `O grupo ${group.name} deixará de estar disponível para todos os participantes. Seus materiais pessoais serão mantidos.`, destructive: true, navigateAway: true, action: async () => { await repository.deleteGroup(); await navigate({ to: '/groups' }) } })}>Excluir grupo<span className="ml-auto text-[9px]">Admin</span></DropdownMenuItem>}
          </DropdownMenuContent></DropdownMenu>
        </div>
      </header>
      {notice && <p role="status" className="text-xs text-accent">{notice}</p>}
      {group.archived && <p role="status" className="rounded-xl bg-muted p-4 text-xs text-muted-foreground">Este grupo está arquivado. As atividades estão disponíveis para consulta.</p>}
      <div role="tablist" aria-label="Áreas do grupo" className="flex gap-5 border-b border-border pt-1">
        {tabs.map((item, index) => <button key={item.id} type="button" role="tab" id={`group-tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`group-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} className={cn('min-h-11 border-b-2 px-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-ring', tab === item.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-primary')} onClick={() => setTab(item.id)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
          setTab(tabs[next].id); document.getElementById(`group-tab-${tabs[next].id}`)?.focus()
        }}>{item.label}</button>)}
      </div>
      <div role="tabpanel" id={`group-panel-${tab}`} aria-labelledby={`group-tab-${tab}`}>
        {tab === 'feed' && <GroupFeedPanel feed={feed} busy={busy} archived={!!group.archived} loadingMore={loadingMore} onComment={text => mutate(() => repository.comment(text))} onLoadMore={() => { void loadMore() }} onDownload={id => run(() => download(id))} onDelete={item => confirm({ title: 'Excluir comentário?', description: 'O comentário será removido do feed do grupo.', destructive: true, action: () => repository.deleteComment(item.id) })} />}
        {tab === 'members' && <GroupMembersPanel members={data.members} userId={session.user.id} canManage={!!admin && writable} onRole={changeRole} onRemove={removeMember} />}
        {tab === 'materials' && <section aria-label="Materiais do grupo" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{data.materials.length} {data.materials.length === 1 ? 'material compartilhado' : 'materiais compartilhados'}</p><Button disabled={!writable} className="text-xs" onClick={() => run(async () => { setOwnMaterials(await repository.ownMaterials()); setSharing(true) })}><Plus className="size-3.5" />Compartilhar material</Button></div>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">{!data.materials.length && <p className="p-8 text-center text-xs text-muted-foreground">Compartilhe arquivos já enviados na aba Materiais para estudar com o grupo.</p>}{data.materials.map(material => <article key={material.id_material} className="flex flex-wrap items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-lg bg-muted text-accent"><FileText className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="text-xs font-semibold text-primary [overflow-wrap:anywhere]">{material.titulo}</h2><p className="mt-1 text-[10px] text-muted-foreground">{formatMaterialSize(material.tamanho_bytes)}</p>{material.descricao && <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{material.descricao}</p>}</div><Button variant="outline" className="text-xs" disabled={busy} onClick={() => run(() => download(material.id_material))}>Baixar</Button>{(admin || String(material.id_usuario) === session.user.id) && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" aria-label={`Ações do material ${material.titulo}`} disabled={!writable}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={() => confirm({ title: 'Remover compartilhamento?', description: 'O arquivo original continuará na conta de quem o enviou.', destructive: true, action: () => repository.unshare(material.id_material) })}>Remover compartilhamento</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</article>)}</div>
        </section>}
      </div>
      {activitiesOpen && <GroupActivities data={data} session={session} busy={busy} onClose={() => setActivitiesOpen(false)} onMutation={mutate} />}
      {groupEditor && <GroupDialog group={group} onClose={() => setGroupEditor(false)} onSave={input => mutate(() => groupRepository.update(groupId, input))} />}
      <Dialog open={inviteOpen} onOpenChange={open => { if (!busy) setInviteOpen(open) }}><DialogContent className="sm:max-w-md"><DialogTitle>Convidar para {group.name}</DialogTitle><DialogDescription>Compartilhe este código com quem você quer convidar para estudar no grupo.</DialogDescription><InviteCode code={group.inviteCode} />{admin && <Button variant="outline" className="text-xs" disabled={!writable} onClick={() => { setInviteOpen(false); confirm({ title: 'Renovar convite?', description: 'O código atual deixará de permitir novas entradas. Os membros atuais continuam no grupo.', action: repository.rotate }) }}>Renovar convite</Button>}</DialogContent></Dialog>
      <Dialog open={sharing} onOpenChange={open => { if (!busy) setSharing(open) }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogTitle>Compartilhar material</DialogTitle><DialogDescription>Escolha um arquivo da sua conta para compartilhar com os membros do grupo.</DialogDescription>{availableMaterials.map(item => <Button key={item.id_material} disabled={busy} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left text-xs" onClick={() => run(async () => { await repository.share(item.id_material); setSharing(false) })}><FileText className="size-4 shrink-0" />{item.titulo}</Button>)}{!availableMaterials.length && <p className="text-xs text-muted-foreground">{ownMaterials.length ? 'Seus materiais já estão compartilhados neste grupo.' : 'Envie um arquivo na aba Materiais primeiro.'}</p>}</DialogContent></Dialog>
    </>}
    <Dialog open={!!confirmation} onOpenChange={open => { if (!open && !busy) setConfirmation(null) }}><DialogContent><DialogTitle>{confirmation?.title}</DialogTitle><DialogDescription>{confirmation?.description}</DialogDescription>{confirmationError && <p role="alert" className="text-xs text-destructive-text">{confirmationError}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setConfirmation(null)}>Cancelar</Button><Button variant={confirmation?.destructive ? 'destructive' : 'default'} disabled={busy} onClick={() => { void applyConfirmation() }}>{busy ? 'Salvando...' : 'Confirmar'}</Button></div></DialogContent></Dialog>
  </div>
}
