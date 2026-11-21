import { Card } from '@/components/ui/card'
import { formatarDuracao, totaisPorDia } from '@/lib/study-sessions'

export function HoursPerDayChart({ dias }: { dias: ReturnType<typeof totaisPorDia> }) {
  const maximo = Math.max(4, Math.ceil(Math.max(...dias.map(dia => dia.minutos)) / 60))
  const marcas = Array.from({ length: 5 }, (_, indice) => maximo * (4 - indice) / 4)
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-primary">Horas por dia</h2>
      <p className="sr-only">Tempo de estudo na semana atual, de segunda a domingo.</p>
      <div className="relative mb-7 ml-7 mr-1 mt-6 h-44" aria-hidden="true">
        {marcas.map(marca => <div key={marca} className="absolute left-0 right-0 border-t border-border/70" style={{ bottom: `${marca / maximo * 100}%` }}><span className="absolute -left-7 -top-2 text-[10px] text-muted-foreground">{marca}h</span></div>)}
        <div className="absolute inset-0 flex items-end justify-around gap-1">
          {dias.map(dia => <div key={dia.data} className="relative flex h-full flex-1 items-end justify-center">
            <div className="relative w-5 rounded-t bg-accent sm:w-6" style={{ height: `${dia.minutos / 60 / maximo * 100}%` }}>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-accent">{Number((dia.minutos / 60).toFixed(2))}h</span>
            </div>
            <span className="absolute -bottom-7 text-[10px] text-muted-foreground">{dia.rotulo}</span>
          </div>)}
        </div>
      </div>
      <ul className="sr-only">{dias.map(dia => <li key={dia.data}>{dia.rotulo}: {formatarDuracao(dia.minutos)}</li>)}</ul>
    </Card>
  )
}
