import { Atom, Bot, Laptop, Pencil, Sigma, Smartphone } from 'lucide-react'
import type { GroupIcon as IconName } from '@/data/groups'
import { cn } from '@/lib/utils'

const icons = {
  react: { icon: Atom, style: 'bg-accent/10 text-accent' },
  pencil: { icon: Pencil, style: 'bg-chart-2/10 text-chart-2' },
  laptop: { icon: Laptop, style: 'bg-success/10 text-success' },
  math: { icon: Sigma, style: 'bg-warning/10 text-primary' },
  phone: { icon: Smartphone, style: 'bg-chart-5/10 text-chart-5' },
  robot: { icon: Bot, style: 'bg-chart-2/10 text-chart-2' },
}

export function GroupIcon({ name, className }: { name: IconName; className?: string }) {
  const { icon: Icon, style } = icons[name]
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', style, className)}>
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
    </span>
  )
}
