import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RespostaProgresso } from '@/api/progresso'

type Discipline = RespostaProgresso['disciplinas'][number]

const COLORS = ['#6251e8', '#fb7059', '#48ad80', '#f0b735', '#403399', '#3197a4', '#bf5baa', '#76849b']
const RADIUS = 39
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function GraficoDistribuicaoDisciplinas({ disciplines }: { disciplines: Discipline[] }) {
  const total = disciplines.reduce((sum, discipline) => sum + discipline.tarefas_total, 0)
  let offset = 0
  const segments = disciplines.map((discipline, index) => {
    const length = total === 0 ? 0 : (discipline.tarefas_total / total) * CIRCUMFERENCE
    const segment = { ...discipline, color: COLORS[index % COLORS.length], length, offset }
    offset += length
    return segment
  })

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Tarefas por disciplina</CardTitle>
        <p className="text-xs text-muted-foreground">Distribuição das tarefas cadastradas</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 pt-0 sm:flex-row sm:items-center">
        <div className="relative size-36 shrink-0" role="img" aria-label={`Distribuição de ${total} tarefas entre ${disciplines.length} disciplinas`}>
          <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r={RADIUS} stroke="var(--color-muted)" strokeWidth="12" />
            {segments.map((segment) => segment.length > 0 && (
              <circle
                cx="50"
                cy="50"
                fill="none"
                key={segment.disciplina_id}
                r={RADIUS}
                stroke={segment.color}
                strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                strokeDashoffset={-segment.offset}
                strokeWidth="12"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums">{total}</span>
            <span className="text-[11px] text-muted-foreground">tarefas</span>
          </div>
        </div>
        {disciplines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
        ) : (
          <ul className="max-h-40 w-full min-w-0 space-y-2 overflow-y-auto">
            {segments.map((discipline) => (
              <li className="flex items-center gap-2 text-sm" key={discipline.disciplina_id}>
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: discipline.color }} />
                <span className="min-w-0 flex-1 truncate">{discipline.nome}</span>
                <span className="font-semibold tabular-nums">{discipline.tarefas_total}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
