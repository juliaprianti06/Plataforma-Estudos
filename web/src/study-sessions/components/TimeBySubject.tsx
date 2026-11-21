import { Card } from '@/components/ui/card'
import { formatarDuracao, totaisPorDisciplina } from '@/lib/study-sessions'

export function TimeBySubject({ totais }: { totais: ReturnType<typeof totaisPorDisciplina> }) {
  const total = totais.reduce((soma, item) => soma + item.minutos, 0)
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-primary">Tempo por disciplina</h2>
      {!totais.length && <p className="py-8 text-sm text-muted-foreground">Os tempos por disciplina aparecerão aqui.</p>}
      <ul className="space-y-4">
        {totais.map(({ disciplina, minutos }) => <li key={disciplina.id}>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${disciplina.cor || 'bg-accent'}`} /><span className="truncate">{disciplina.nome}</span></span>
            <span className="font-semibold text-primary">{formatarDuracao(minutos)}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className={`h-full rounded-full ${disciplina.cor || 'bg-accent'}`} style={{ width: `${total ? minutos / total * 100 : 0}%` }} /></div>
        </li>)}
      </ul>
    </Card>
  )
}
