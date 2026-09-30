import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardList, LoaderCircle, Menu, RefreshCw, TrendingUp } from 'lucide-react'
import { buscarProgresso, type PeriodoProgresso, type RespostaProgresso } from '@/api/progresso'
import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraficoDistribuicaoDisciplinas } from './components/grafico-distribuicao-disciplinas'
import { ListaProgressoDisciplinas } from './components/lista-progresso-disciplinas'
import { GraficoEvolucao } from './components/grafico-evolucao'
import { CartaoIndicador } from './components/cartao-indicador'
import { CartaoTempoEstudo } from './components/cartao-tempo-estudo'

type EstadoProgresso =
  | { chave: string; estado: 'carregando' }
  | { chave: string; estado: 'erro' }
  | { chave: string; estado: 'sucesso'; dados: RespostaProgresso }

function formatarPercentual(valor: number | null) {
  return valor === null ? '—' : `${valor.toLocaleString('pt-BR')}%`
}

export default function Progresso() {
  const { openMenu } = useLayout()
  const [periodo, setPeriodo] = useState<PeriodoProgresso>('semana')
  const [tentativa, setTentativa] = useState(0)
  const chaveRequisicao = `${periodo}:${tentativa}`
  const [resultado, setResultado] = useState<EstadoProgresso>({
    chave: chaveRequisicao,
    estado: 'carregando',
  })

  useEffect(() => {
    const controller = new AbortController()

    buscarProgresso(periodo, controller.signal)
      .then((dados) => {
        if (!controller.signal.aborted) {
          setResultado({ chave: chaveRequisicao, estado: 'sucesso', dados })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResultado({ chave: chaveRequisicao, estado: 'erro' })
        }
      })

    return () => controller.abort()
  }, [chaveRequisicao, periodo])

  const estadoAtual = resultado.chave === chaveRequisicao
    ? resultado
    : { chave: chaveRequisicao, estado: 'carregando' as const }
  const carregando = estadoAtual.estado === 'carregando'
  const erro = estadoAtual.estado === 'erro'
  const dados = estadoAtual.estado === 'sucesso' ? estadoAtual.dados : null
  const indicadores = dados?.indicadores
  const semTarefas = dados !== null && indicadores?.tarefas_total === 0

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Abrir menu de navegação"
            className="lg:hidden"
            onClick={openMenu}
            size="icon"
            variant="outline"
          >
            <Menu aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Progresso</h1>
            <p className="text-sm text-muted-foreground">Suas métricas de estudo</p>
          </div>
        </div>

        <div aria-label="Período do progresso" className="flex rounded-lg border bg-card p-1" role="group">
          {([
            ['semana', 'Semana'],
            ['mes', 'Mês'],
          ] as const).map(([valor, rotulo]) => (
            <Button
              aria-pressed={periodo === valor}
              key={valor}
              onClick={() => setPeriodo(valor)}
              size="sm"
              variant={periodo === valor ? 'default' : 'ghost'}
            >
              {rotulo}
            </Button>
          ))}
        </div>
      </header>

      {carregando && (
        <div className="flex min-h-48 items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground" role="status">
          <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
          Carregando seu progresso…
        </div>
      )}

      {!carregando && erro && (
        <Card role="alert">
          <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 text-destructive" />
              <div>
                <h2 className="font-medium">Não foi possível carregar seu progresso</h2>
                <p className="mt-1 text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
              </div>
            </div>
            <Button onClick={() => setTentativa((atual) => atual + 1)} variant="outline">
              <RefreshCw aria-hidden="true" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && semTarefas && (
        <Card>
          <CardHeader>
            <CardTitle>Ainda não há tarefas para acompanhar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cadastre tarefas em uma disciplina e seu progresso aparecerá aqui.
          </CardContent>
        </Card>
      )}

      {!carregando && !erro && dados && !semTarefas && indicadores && (
        <div className="space-y-5">
          <section aria-label="Resumo do progresso" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <CartaoIndicador
              detail={`${indicadores.tarefas_concluidas_total} de ${indicadores.tarefas_total} tarefas concluídas`}
              icon={TrendingUp}
              label="Progresso geral"
              progress={indicadores.progresso_geral_percentual}
              tone="primary"
              value={formatarPercentual(indicadores.progresso_geral_percentual)}
            />
            <CartaoIndicador
              detail={`${indicadores.tarefas_concluidas_periodo} concluídas no período`}
              icon={CheckCircle2}
              label="Tarefas concluídas"
              tone="success"
              value={indicadores.tarefas_concluidas_total.toLocaleString('pt-BR')}
            />
            <CartaoIndicador
              detail="Tarefas abertas com vencimento anterior a hoje"
              icon={ClipboardList}
              label="Tarefas atrasadas"
              tone="warning"
              value={indicadores.tarefas_atrasadas.toLocaleString('pt-BR')}
            />
          </section>

          <section aria-label="Evolução e tempo de estudo" className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)]">
            <GraficoEvolucao points={dados.evolucao} />
            <CartaoTempoEstudo data={dados.tempo_estudo} />
          </section>

          <section aria-label="Progresso por disciplina" className="grid items-start gap-5 lg:grid-cols-2">
            <GraficoDistribuicaoDisciplinas disciplines={dados.disciplinas} />
            <ListaProgressoDisciplinas disciplines={dados.disciplinas} />
          </section>

          <p className="text-right text-xs text-muted-foreground">
            Atualizado em {new Date(dados.atualizado_em).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  )
}
