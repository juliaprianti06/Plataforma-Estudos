from calendar import monthrange
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.repository.progresso_repository import ProgressoRepository
from app.schemas.progresso_schema import PeriodoProgresso


FUSO_NEGOCIO = ZoneInfo('America/Sao_Paulo')


def _intervalo_periodo(hoje: date, periodo: PeriodoProgresso) -> tuple[date, date]:
    if periodo == 'semana':
        inicio = hoje - timedelta(days=hoje.weekday())
        return inicio, inicio + timedelta(days=7)

    inicio = hoje.replace(day=1)
    return inicio, inicio.replace(day=monthrange(inicio.year, inicio.month)[1]) + timedelta(days=1)


def _inicio_mes_anterior(inicio_mes: date) -> date:
    ultimo_dia_mes_anterior = inicio_mes - timedelta(days=1)
    return ultimo_dia_mes_anterior.replace(day=1)


def _instante_utc(data_local: date) -> datetime:
    return datetime.combine(data_local, time.min, FUSO_NEGOCIO).astimezone(timezone.utc)


def _percentual(numerador: int, denominador: int) -> float | None:
    if denominador == 0:
        return None
    return round(numerador * 100 / denominador, 1)


def _pontos_evolucao(
    inicio: date, fim_exclusivo: date, periodo: PeriodoProgresso,
    conclusoes_por_dia: dict[date, int],
) -> list[dict]:
    pontos = []
    cursor = inicio
    while cursor < fim_exclusivo:
        fim_ponto = min(cursor + timedelta(days=1), fim_exclusivo)
        if periodo == 'mes':
            dias_ate_segunda = 7 - cursor.weekday()
            fim_ponto = min(cursor + timedelta(days=dias_ate_segunda), fim_exclusivo)
        pontos.append({
            'inicio': cursor,
            'fim_exclusivo': fim_ponto,
            'rotulo': cursor.strftime('%d/%m') if periodo == 'semana'
            else f'{cursor:%d/%m}–{(fim_ponto - timedelta(days=1)):%d/%m}',
            'conclusoes': sum(
                total for dia, total in conclusoes_por_dia.items()
                if cursor <= dia < fim_ponto
            ),
        })
        cursor = fim_ponto
    return pontos


def obter_progresso(
    repository: ProgressoRepository, usuario_id: int,
    periodo: PeriodoProgresso, agora: datetime | None = None,
) -> dict:
    agora_utc = agora or datetime.now(timezone.utc)
    agora_local = agora_utc.astimezone(FUSO_NEGOCIO)
    hoje = agora_local.date()
    inicio, fim_exclusivo = _intervalo_periodo(hoje, periodo)
    if periodo == 'semana':
        inicio_anterior = inicio - timedelta(days=7)
    else:
        inicio_anterior = _inicio_mes_anterior(inicio)

    intervalo_atual = repository.tarefas_com_prazo_no_periodo(usuario_id, inicio, fim_exclusivo)
    intervalo_anterior = repository.tarefas_com_prazo_no_periodo(usuario_id, inicio_anterior, inicio)
    taxa_atual = _percentual(intervalo_atual['concluidas'], intervalo_atual['total'])
    taxa_anterior = _percentual(intervalo_anterior['concluidas'], intervalo_anterior['total'])
    variacao = None if taxa_atual is None or taxa_anterior is None else round(taxa_atual - taxa_anterior, 1)

    inicio_utc = _instante_utc(inicio)
    fim_utc = _instante_utc(fim_exclusivo)
    indicadores_atuais = repository.indicadores_atuais(usuario_id, hoje)
    disciplinas = repository.disciplinas_do_usuario(usuario_id)
    conclusoes_disciplina = repository.conclusoes_por_disciplina(usuario_id, inicio_utc, fim_utc)
    for disciplina in disciplinas:
        total = disciplina['tarefas_total']
        disciplina['progresso_percentual'] = _percentual(disciplina['tarefas_concluidas_total'], total)
        disciplina['conclusoes_periodo'] = conclusoes_disciplina.get(disciplina['disciplina_id'], 0)
    disciplinas.sort(key=lambda item: (-item['conclusoes_periodo'], -item['progresso_percentual'] if item['progresso_percentual'] is not None else 1, item['nome'].casefold(), item['disciplina_id']))

    conclusoes_por_dia = repository.conclusoes_por_dia(usuario_id, inicio_utc, fim_utc, FUSO_NEGOCIO.key)
    return {
        'periodo': periodo,
        'intervalo': {'inicio': inicio, 'fim_exclusivo': fim_exclusivo},
        'atualizado_em': agora_utc,
        'indicadores': {
            **indicadores_atuais,
            'tarefas_concluidas_periodo': repository.conclusoes_no_periodo(usuario_id, inicio_utc, fim_utc),
            'tarefas_com_prazo_periodo': intervalo_atual['total'],
            'tarefas_com_prazo_concluidas_periodo': intervalo_atual['concluidas'],
            'progresso_geral_percentual': _percentual(
                indicadores_atuais['tarefas_concluidas_total'], indicadores_atuais['tarefas_total'],
            ),
            'taxa_conclusao_percentual': taxa_atual,
            'taxa_conclusao_periodo_anterior_percentual': taxa_anterior,
            'variacao_taxa_pontos_percentuais': variacao,
        },
        'evolucao': _pontos_evolucao(
            inicio, fim_exclusivo, periodo, conclusoes_por_dia,
        ),
        'disciplinas': disciplinas,
        'tempo_estudo': {
            'disponivel': False,
            'minutos_total': None,
            'mensagem': 'A plataforma ainda não registra sessões de estudo.',
        },
        'conclusoes_sem_data': repository.conclusoes_sem_data(usuario_id),
    }
