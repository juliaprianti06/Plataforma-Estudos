import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { buscarProgresso, type RespostaProgresso } from '@/api/progresso'
import Progresso from '@/pages/progresso'

vi.mock('@/api/progresso', () => ({
  buscarProgresso: vi.fn(),
}))

function criarResposta(overrides: Partial<RespostaProgresso> = {}): RespostaProgresso {
  return {
    periodo: 'semana',
    intervalo: { inicio: '2026-09-21', fim_exclusivo: '2026-09-28' },
    atualizado_em: '2026-09-23T15:00:00Z',
    indicadores: {
      tarefas_total: 3,
      tarefas_concluidas_total: 2,
      progresso_geral_percentual: 66.7,
      tarefas_concluidas_periodo: 1,
      tarefas_atrasadas: 1,
      tarefas_com_prazo_periodo: 1,
      tarefas_com_prazo_concluidas_periodo: 1,
      taxa_conclusao_percentual: 100,
      taxa_conclusao_periodo_anterior_percentual: null,
      variacao_taxa_pontos_percentuais: null,
    },
    evolucao: [{
      inicio: '2026-09-21',
      fim_exclusivo: '2026-09-22',
      rotulo: '21/09',
      conclusoes: 1,
    }],
    disciplinas: [{
      disciplina_id: 1,
      nome: 'Matemática',
      tarefas_total: 3,
      tarefas_concluidas_total: 2,
      progresso_percentual: 66.7,
      conclusoes_periodo: 1,
    }],
    tempo_estudo: {
      disponivel: false,
      minutos_total: null,
      mensagem: 'A plataforma ainda não registra sessões de estudo.',
    },
    conclusoes_sem_data: 0,
    ...overrides,
  }
}

describe('página de progresso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('mostra carregamento, indicadores e busca os dados ao trocar o período', async () => {
    const respostaSemana = criarResposta()
    const respostaMes = criarResposta({
      periodo: 'mes',
      intervalo: { inicio: '2026-09-01', fim_exclusivo: '2026-10-01' },
      indicadores: {
        ...criarResposta().indicadores,
        tarefas_concluidas_periodo: 4,
      },
    })
    const resolucoes: Array<(resposta: RespostaProgresso) => void> = []
    vi.mocked(buscarProgresso).mockImplementation(() => new Promise((resolve) => {
      resolucoes.push(resolve)
    }))

    render(<Progresso />)

    expect(screen.getByRole('status')).toHaveTextContent('Carregando seu progresso')
    await waitFor(() => expect(resolucoes).toHaveLength(1))
    await act(async () => resolucoes[0](respostaSemana))

    expect(await screen.findByText('Progresso geral')).toBeInTheDocument()
    expect(screen.getByText('66,7%')).toBeInTheDocument()
    expect(screen.getAllByText('Matemática')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Mês' }))
    await waitFor(() => expect(resolucoes).toHaveLength(2))
    expect(buscarProgresso).toHaveBeenNthCalledWith(2, 'mes', expect.any(AbortSignal))
    await act(async () => resolucoes[1](respostaMes))

    expect(await screen.findByText('4 concluídas no período')).toBeInTheDocument()
  })

  test('mostra erro e permite tentar novamente', async () => {
    vi.mocked(buscarProgresso)
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(criarResposta())

    render(<Progresso />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seu progresso')
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(await screen.findByText('Progresso geral')).toBeInTheDocument()
    expect(buscarProgresso).toHaveBeenCalledTimes(2)
  })

  test('orienta o estudante quando ainda não há tarefas', async () => {
    vi.mocked(buscarProgresso).mockResolvedValue(criarResposta({
      disciplinas: [],
      indicadores: {
        ...criarResposta().indicadores,
        tarefas_total: 0,
        tarefas_concluidas_total: 0,
        progresso_geral_percentual: null,
      },
    }))

    render(<Progresso />)

    expect(await screen.findByText('Ainda não há tarefas para acompanhar')).toBeInTheDocument()
    expect(screen.getByText('Cadastre tarefas em uma disciplina e seu progresso aparecerá aqui.')).toBeInTheDocument()
  })
})
