import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RespostaProgresso } from '@/api/progresso'

type EvolutionPoint = RespostaProgresso['evolucao'][number]

const WIDTH = 680
const HEIGHT = 250
const LEFT = 38
const RIGHT = 12
const TOP = 16
const BOTTOM = 42

export function GraficoEvolucao({ points }: { points: EvolutionPoint[] }) {
  const maxValue = Math.max(0, ...points.map((point) => point.conclusoes))
  const axisMax = Math.max(4, Math.ceil(maxValue / 4) * 4)
  const plotWidth = WIDTH - LEFT - RIGHT
  const plotHeight = HEIGHT - TOP - BOTTOM
  const coordinates = points.map((point, index) => ({
    x: points.length <= 1 ? LEFT + plotWidth / 2 : LEFT + (index * plotWidth) / (points.length - 1),
    y: TOP + plotHeight - (point.conclusoes / axisMax) * plotHeight,
    ...point,
  }))
  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Evolução de tarefas concluídas</CardTitle>
        <p className="text-xs text-muted-foreground">Conclusões registradas no período selecionado</p>
      </CardHeader>
      <CardContent className="pt-0">
        {points.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Sem dados de evolução neste período.</p>
        ) : (
          <div className="w-full overflow-hidden">
            <svg
              aria-label={`Evolução de conclusões: ${points.map((point) => `${point.rotulo}: ${point.conclusoes}`).join(', ')}`}
              className="h-56 w-full overflow-visible"
              preserveAspectRatio="none"
              role="img"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            >
              {[0, 1, 2, 3, 4].map((step) => {
                const value = (axisMax * step) / 4
                const y = TOP + plotHeight - (value / axisMax) * plotHeight
                return (
                  <g key={step}>
                    <line className="stroke-border" x1={LEFT} x2={WIDTH - RIGHT} y1={y} y2={y} />
                    <text className="fill-muted-foreground" fontSize="10" textAnchor="end" x={LEFT - 8} y={y + 3}>
                      {Number.isInteger(value) ? value : value.toFixed(1)}
                    </text>
                  </g>
                )
              })}
              {coordinates.length > 1 && (
                <polyline fill="none" points={polyline} stroke="var(--color-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              )}
              {coordinates.map(({ x, y, rotulo, conclusoes }, index) => (
                <g key={`${rotulo}-${index}`}>
                  <circle cx={x} cy={y} fill="var(--color-primary)" r="4" />
                  <text className="fill-muted-foreground" fontSize="9" textAnchor="middle" x={x} y={HEIGHT - 12}>
                    {rotulo}
                  </text>
                  <title>{`${rotulo}: ${conclusoes} conclusões`}</title>
                </g>
              ))}
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
