import { Info, Pencil } from 'lucide-react'
import type { StudyGroup } from '@/data/groups'
import { cn } from '@/lib/utils'
import { GroupIcon } from './group-icon'

const categoryColors = {
  Programação: 'bg-accent',
  Design: 'bg-chart-2',
  Matemática: 'bg-chart-3',
}

export function GroupCard({ group, onOpen }: { group: StudyGroup; onOpen: (group: StudyGroup) => void }) {
  return (
    <article className="flex min-h-[194px] flex-col rounded-[14px] border border-border bg-card p-4 transition duration-200 hover:border-ring/50 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <GroupIcon name={group.icon} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-[13px] font-bold leading-snug tracking-[-0.02em] text-card-foreground">
            <button className="rounded text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" onClick={() => onOpen(group)}>
              {group.name}
            </button>
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', categoryColors[group.category])} />
            {group.category}
          </p>
        </div>
        <button
          type="button"
          aria-label={`${group.role === 'admin' ? 'Editar' : 'Ver detalhes de'} ${group.name}`}
          title={group.role === 'admin' ? 'Editar grupo' : 'Ver detalhes do grupo'}
          className="-mr-1 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => onOpen(group)}
        >
          {group.role === 'admin' ? <Pencil className="size-3.5" /> : <Info className="size-3.5" />}
        </button>
      </div>
      <p className="mb-3 mt-3 line-clamp-3 flex-1 text-[11px] leading-[1.5] text-muted-foreground">{group.description}</p>
      <div aria-hidden="true" className="mb-3 flex -space-x-2">
        {['bg-chart-2/40', 'bg-success/40', 'bg-accent/40', 'bg-warning/40'].slice(0, Math.min(4, group.members)).map((color) => (
          <span key={color} className={cn('size-5 rounded-full border-2 border-card', color)} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-[10px] text-muted-foreground">{group.members} {group.members === 1 ? 'membro' : 'membros'}</span>
        <span className={cn('rounded-md px-2 py-1 text-[9px]', group.role === 'admin' ? 'bg-muted font-semibold text-accent' : 'bg-background text-muted-foreground')}>
          {group.role === 'admin' ? 'Admin' : 'Membro'}
        </span>
      </div>
    </article>
  )
}
