import type { StudySummary } from '@/dashboard/api-repository'
import { useState } from 'react'
import { Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { dashboardSummary } from '@/data/dashboard'

export function StudyCard({ summary, onResume, busy = false }: { summary?: StudySummary; onResume?: () => void; busy?: boolean }) {
  const [resumed, setResumed] = useState(false)

  const progress = summary?.progress ?? dashboardSummary.courseProgress
  return (
    <section className="rounded-xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/15">
      <p className="text-[11px] font-semibold text-primary-foreground/85">Continuar estudando</p>
      <h2 className="mt-5 font-heading text-lg font-bold leading-tight tracking-[-0.02em]">
        {summary ? (summary.activeTask?.title ?? 'Nenhuma tarefa pendente para você') : dashboardSummary.activeCourse}
      </h2>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-foreground/25">
        <div
          aria-label={`${progress}% concluído`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progress}
          className="h-full rounded-full bg-primary-foreground"
          role="progressbar"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span aria-live="polite" className="text-[10px] text-primary-foreground/75">
          {summary ? `${summary.completed} de ${summary.total} tarefas concluídas` : resumed ? 'Aula retomada!' : `${progress}% concluído`}
        </span>
        <Button
          className="h-9 rounded-full bg-primary-foreground px-5 text-[10px] font-bold text-primary hover:bg-primary-foreground/90"
          disabled={busy || (summary !== undefined && !summary.activeTask)}
          onClick={onResume ?? (() => setResumed(true))}
        >
          <Play aria-hidden="true" className="size-3 fill-current" />
          {busy ? 'SALVANDO...' : summary?.activeTask?.status === 'progress' || resumed ? 'EM ANDAMENTO' : 'RETOMAR'}
        </Button>
      </div>
    </section>
  )
}
