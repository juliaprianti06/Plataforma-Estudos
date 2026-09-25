import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RespostaProgresso } from '@/api/progresso'

type Discipline = RespostaProgresso['disciplinas'][number]

const COLORS = ['#6251e8', '#fb7059', '#48ad80', '#f0b735', '#403399', '#3197a4', '#bf5baa', '#76849b']

export function ListaProgressoDisciplinas({ disciplines }: { disciplines: Discipline[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Progresso por disciplina</CardTitle>
        <p className="text-xs text-muted-foreground">Tarefas concluídas em relação ao total</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {disciplines.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
        ) : disciplines.map((discipline, index) => {
          const progress = discipline.progresso_percentual === null
            ? 0
            : Math.max(0, Math.min(discipline.progresso_percentual, 100))
          return (
            <div className="grid grid-cols-[minmax(5rem,7rem)_minmax(0,1fr)_3rem] items-center gap-3" key={discipline.disciplina_id}>
              <span className="truncate text-sm" title={discipline.nome}>{discipline.nome}</span>
              <div
                aria-label={`${discipline.nome}: ${discipline.progresso_percentual === null ? 'sem tarefas' : `${discipline.progresso_percentual}%`}`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progress}
                className="h-2.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div className="h-full rounded-full transition-[width]" style={{ width: `${progress}%`, backgroundColor: COLORS[index % COLORS.length] }} />
              </div>
              <span className="text-right text-xs font-semibold tabular-nums">
                {discipline.progresso_percentual === null ? '—' : `${discipline.progresso_percentual}%`}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
