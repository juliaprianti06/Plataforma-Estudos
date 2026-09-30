import { api } from './client'

export type PeriodoProgresso = 'semana' | 'mes'

export type RespostaProgresso = {
  periodo: PeriodoProgresso
  intervalo: {
    inicio: string
    fim_exclusivo: string
  }
  atualizado_em: string
  indicadores: {
    tarefas_total: number
    tarefas_concluidas_total: number
    progresso_geral_percentual: number | null
    tarefas_concluidas_periodo: number
    tarefas_atrasadas: number
    tarefas_com_prazo_periodo: number
    tarefas_com_prazo_concluidas_periodo: number
    taxa_conclusao_percentual: number | null
    taxa_conclusao_periodo_anterior_percentual: number | null
    variacao_taxa_pontos_percentuais: number | null
  }
  evolucao: Array<{
    inicio: string
    fim_exclusivo: string
    rotulo: string
    conclusoes: number
  }>
  disciplinas: Array<{
    disciplina_id: number
    nome: string
    tarefas_total: number
    tarefas_concluidas_total: number
    progresso_percentual: number | null
    conclusoes_periodo: number
  }>
  tempo_estudo: {
    disponivel: boolean
    minutos_total: number | null
    mensagem: string
  }
  conclusoes_sem_data: number
}

export async function buscarProgresso(
  periodo: PeriodoProgresso,
  signal?: AbortSignal,
): Promise<RespostaProgresso> {
  const resposta = await api.get<RespostaProgresso>('/progresso/', {
    params: { periodo },
    signal,
  })
  return resposta.data
}
