import { TimerOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RespostaProgresso } from '@/api/progresso'

export function CartaoTempoEstudo({ data }: { data: RespostaProgresso['tempo_estudo'] }) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Tempo de estudo</CardTitle>
        <p className="text-xs text-muted-foreground">Tempo registrado no período</p>
      </CardHeader>
      <CardContent className="flex min-h-36 flex-1 flex-col items-center justify-center gap-3 pt-0 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TimerOff aria-hidden="true" className="size-5" />
        </span>
        <p className="max-w-xs text-sm text-muted-foreground">
          {data.disponivel && data.minutos_total !== null
            ? `${Math.floor(data.minutos_total / 60)}h ${data.minutos_total % 60}min registrados`
            : data.mensagem}
        </p>
      </CardContent>
    </Card>
  )
}
