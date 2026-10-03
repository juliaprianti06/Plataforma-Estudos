import { useState } from 'react'
import { FileText, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { GroupActivity, GroupFeed } from '@/groups/workspace-repository'
import { formatActivityTime, formatMaterialSize } from '@/groups/format-activity'
import { MemberAvatar } from './member-avatar'

type Props = {
  feed: GroupFeed; busy: boolean; archived: boolean; loadingMore: boolean
  onComment: (text: string) => Promise<void>; onDelete: (item: GroupActivity) => void
  onDownload: (id: number) => void; onLoadMore: () => void
}

export function GroupFeedPanel({ feed, busy, archived, loadingMore, onComment, onDelete, onDownload, onLoadMore }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  async function submit() {
    if (!text.trim() || busy) return
    setError('')
    try { await onComment(text.trim()); setText('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível publicar o comentário.') }
  }
  return <section aria-label="Atividades do grupo" className="space-y-4">
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {!feed.items.length && <div className="p-8 text-center"><h2 className="text-sm font-semibold text-primary">O feed do grupo começa aqui</h2><p className="mt-2 text-xs text-muted-foreground">Comentários, novos participantes e compartilhamentos aparecerão neste espaço.</p></div>}
      {feed.items.map(item => <article key={item.id} className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <MemberAvatar person={item.actor} className="size-7" />
          <div className="min-w-0 flex-1 pt-1 text-xs leading-relaxed text-muted-foreground"><strong className="font-semibold text-primary">{item.actor.name}</strong> {({ comment: 'comentou no grupo', joined: 'entrou no grupo', material: 'compartilhou um material' })[item.kind]}</div>
          <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} className="shrink-0 pt-1 text-right text-[9px] leading-relaxed text-muted-foreground">{formatActivityTime(item.createdAt)}</time>
          {item.canDelete && !archived && <DropdownMenu><DropdownMenuTrigger asChild><Button aria-label={`Ações do comentário de ${item.actor.name}`} variant="ghost" size="icon-xs" disabled={busy}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={() => onDelete(item)}>Excluir comentário</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
        </div>
        {item.text !== null && <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-primary [overflow-wrap:anywhere]">{item.text}</p>}
        {item.material && <button type="button" disabled={busy || !item.material.available || item.material.id === null} onClick={() => onDownload(item.material!.id!)} className="flex w-full items-center gap-3 rounded-lg bg-muted px-3 py-3 text-left transition-colors hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-60">
          <FileText aria-hidden="true" className="size-5 shrink-0 text-accent" /><span className="min-w-0"><span className="block text-xs font-semibold text-primary [overflow-wrap:anywhere]">{item.material.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{formatMaterialSize(item.material.size)}{!item.material.available && ' · Compartilhamento indisponível'}</span></span>
        </button>}
      </article>)}
    </div>
    {feed.nextCursor !== null && <div className="text-center"><Button variant="outline" disabled={loadingMore || busy} onClick={onLoadMore}>{loadingMore ? 'Carregando...' : 'Carregar mais atividades'}</Button></div>}
    {!archived && <form className="space-y-3 rounded-xl border border-border bg-card p-4" onSubmit={event => { event.preventDefault(); void submit() }}>
      <label htmlFor="group-comment" className="text-xs font-semibold text-primary">Comentar no grupo</label>
      <textarea id="group-comment" value={text} onChange={event => setText(event.target.value)} rows={2} maxLength={2000} disabled={busy} placeholder="Compartilhe uma dúvida ou combine os próximos estudos..." className="block w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary placeholder:text-muted-foreground focus:outline-ring" />
      {error && <p role="alert" className="text-xs text-destructive-text">{error}</p>}
      <div className="flex items-center justify-between gap-3"><span className="text-[10px] text-muted-foreground">{text.length}/2000</span><Button type="submit" disabled={busy || !text.trim()}>{busy ? 'Publicando...' : 'Publicar comentário'}</Button></div>
    </form>}
  </section>
}
