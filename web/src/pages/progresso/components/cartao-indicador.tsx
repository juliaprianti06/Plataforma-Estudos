import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type MetricCardProps = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: 'primary' | 'success' | 'warning'
  progress?: number | null
}

const tones = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-orange-500/10 text-orange-600',
}

export function CartaoIndicador({ label, value, detail, icon: Icon, tone, progress }: MetricCardProps) {
  const safeProgress = progress === null || progress === undefined
    ? null
    : Math.max(0, Math.min(progress, 100))

  return (
    <Card className="min-w-0 gap-3">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        {safeProgress !== null && (
          <div
            aria-label={`${label}: ${value}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={safeProgress}
            className="relative mb-1 size-12 shrink-0"
            role="progressbar"
          >
            <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 44 44">
              <circle className="stroke-muted" cx="22" cy="22" fill="none" r="18" strokeWidth="5" />
              <circle
                className="stroke-primary transition-[stroke-dashoffset]"
                cx="22"
                cy="22"
                fill="none"
                r="18"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - safeProgress / 100)}
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
