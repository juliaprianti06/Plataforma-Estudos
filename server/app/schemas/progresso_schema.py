from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel


PeriodoProgresso = Literal['semana', 'mes']


class IntervaloProgresso(BaseModel):
    inicio: date
    fim_exclusivo: date


class IndicadoresProgresso(BaseModel):
    tarefas_total: int
    tarefas_concluidas_total: int
    progresso_geral_percentual: Optional[float]
    tarefas_concluidas_periodo: int
    tarefas_atrasadas: int
    tarefas_com_prazo_periodo: int
    tarefas_com_prazo_concluidas_periodo: int
    taxa_conclusao_percentual: Optional[float]
    taxa_conclusao_periodo_anterior_percentual: Optional[float]
    variacao_taxa_pontos_percentuais: Optional[float]


class PontoEvolucaoProgresso(BaseModel):
    inicio: date
    fim_exclusivo: date
    rotulo: str
    conclusoes: int


class ProgressoDisciplina(BaseModel):
    disciplina_id: int
    nome: str
    tarefas_total: int
    tarefas_concluidas_total: int
    progresso_percentual: Optional[float]
    conclusoes_periodo: int


class TempoEstudoProgresso(BaseModel):
    disponivel: bool
    minutos_total: Optional[int]
    mensagem: str


class DashboardProgressoResponse(BaseModel):
    periodo: PeriodoProgresso
    intervalo: IntervaloProgresso
    atualizado_em: datetime
    indicadores: IndicadoresProgresso
    evolucao: list[PontoEvolucaoProgresso]
    disciplinas: list[ProgressoDisciplina]
    tempo_estudo: TempoEstudoProgresso
    conclusoes_sem_data: int
