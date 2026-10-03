import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { GroupMember } from '@/groups/workspace-repository'
import { MemberAvatar } from './member-avatar'

export function GroupMembersPanel({ members, userId, canManage, onRole, onRemove }: {
  members: GroupMember[]; userId: string; canManage: boolean
  onRole: (member: GroupMember) => void; onRemove: (member: GroupMember) => void
}) {
  return <section aria-label="Membros do grupo" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
    {members.map(member => <article key={member.id} className="flex items-center gap-3 px-4 py-3">
      <MemberAvatar person={member} />
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-primary" title={member.name}>{member.name}{String(member.id) === userId && ' (Você)'}</p><p className="mt-1 truncate text-[10px] text-muted-foreground" title={member.email}>{member.email}</p></div>
      <span className={member.role === 'admin' ? 'rounded bg-[#fb775b] px-2 py-1 text-[9px] font-medium text-white' : 'rounded bg-muted px-2 py-1 text-[9px] font-medium text-accent'}>{member.role === 'admin' ? 'Admin' : 'Membro'}</span>
      {canManage && String(member.id) !== userId && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-xs" aria-label={`Ações de ${member.name}`} className="text-muted-foreground"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onRole(member)}>{member.role === 'admin' ? 'Tornar membro' : 'Promover a admin'}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => onRemove(member)}>Remover do grupo</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
    </article>)}
  </section>
}
