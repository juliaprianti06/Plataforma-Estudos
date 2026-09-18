import type { Dispatch, SetStateAction } from 'react'
import { Bell, CalendarCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProfileInput } from '@/profile/store'

export function PreferencesPanel({ draft, onChange }: { draft: ProfileInput; onChange: Dispatch<SetStateAction<ProfileInput>> }) {
  return (
    <div className="space-y-6 p-5 sm:p-7">
      <div>
        <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-muted text-accent"><Bell className="size-5" /></span>
        <h2 className="text-lg font-semibold text-primary">Notificações do seu jeito</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Escolha os avisos que você quer ver no painel. Você pode mudar de ideia quando quiser.</p>
      </div>
      <div className="divide-y rounded-xl border px-4">
        {([
          { key: 'tasks', title: 'Lembretes de estudos', description: 'Prazos e atividades para manter os estudos em dia.', icon: CalendarCheck },
          { key: 'groups', title: 'Novidades dos grupos', description: 'Encontros e atividades das suas comunidades.', icon: Users },
        ] as const).map(({ key, title, description, icon: Icon }) => (
          <div key={key} className="flex items-center gap-3 py-5">
            <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p id={`preference-${key}`} className="text-xs font-semibold text-primary">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <button type="button" role="switch" aria-checked={draft.notifications[key]} aria-labelledby={`preference-${key}`} onClick={() => onChange((current) => ({ ...current, notifications: { ...current.notifications, [key]: !current.notifications[key] } }))} className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', draft.notifications[key] ? 'bg-accent' : 'bg-input')}>
              <span className={cn('absolute left-0.5 top-0.5 size-5 rounded-full bg-accent-foreground shadow-sm transition-transform', draft.notifications[key] && 'translate-x-5')} />
            </button>
          </div>
        ))}
      </div>
      <p className="rounded-xl bg-muted p-4 text-[11px] leading-relaxed text-muted-foreground">Estas preferências controlam os avisos dentro do MindSpace. Nenhum e-mail ou notificação do navegador será enviado.</p>
    </div>
  )
}
