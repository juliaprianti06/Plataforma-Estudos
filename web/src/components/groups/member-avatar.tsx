import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/groups/format-activity'
import { cn } from '@/lib/utils'

const colors = ['bg-accent', 'bg-[#58b77d]', 'bg-[#fb775b]', 'bg-[#e9b92d]', 'bg-[#48339a]', 'bg-secondary']

export function MemberAvatar({ person, className }: { person: { id: number | null; name: string; avatar: string | null }; className?: string }) {
  return <Avatar title={person.name} className={cn('size-8 shrink-0', className)}>
    <AvatarImage src={person.avatar ?? undefined} alt={`Foto de ${person.name}`} />
    <AvatarFallback className={cn('text-[10px] font-semibold text-white', colors[(person.id ?? 0) % colors.length])}>{initials(person.name)}</AvatarFallback>
  </Avatar>
}
