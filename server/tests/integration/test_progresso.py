from datetime import datetime, timezone
from unittest.mock import patch

from sqlalchemy import text


AGORA_FIXA = datetime(2026, 9, 23, 15, 0, tzinfo=timezone.utc)


class DataHoraFixa(datetime):
    @classmethod
    def now(cls, tz=None):
        return AGORA_FIXA.astimezone(tz) if tz is not None else AGORA_FIXA.replace(tzinfo=None)

    @classmethod
    def combine(cls, data, hora, tzinfo=None):
        return datetime.combine(data, hora, tzinfo)


def congelar_agora():
    return patch('app.services.progresso_service.datetime', DataHoraFixa)


def criar_estudante(client, email: str) -> dict[str, str]:
    resposta = client.post('/api/v1/auth/register', json={
        'name': 'Estudante de teste',
        'email': email,
        'password': 'password123',
    })
    assert resposta.status_code == 201
    return {'Authorization': f"Bearer {resposta.json()['access_token']}"}


def criar_disciplina(client, headers: dict[str, str], nome: str = 'Matemática') -> int:
    resposta = client.post(
        '/api/v1/disciplinas/', json={'nome': nome}, headers=headers,
    )
    assert resposta.status_code == 201
    return resposta.json()['id']


def criar_tarefa(
    client, headers: dict[str, str], disciplina_id: int,
    *, status: str = 'a_fazer', vencimento: str | None = None,
) -> int:
    resposta = client.post('/api/v1/tarefas/', json={
        'nome': 'Estudar conteúdo',
        'prioridade': 'Alta',
        'disciplina_id': disciplina_id,
        'status': status,
        'data_vencimento': vencimento,
    }, headers=headers)
    assert resposta.status_code == 200
    return resposta.json()['id']


def definir_data_conclusao(db, tarefa_id: int, data: str | None) -> None:
    db.execute(
        text('UPDATE tarefas SET concluido_em = :data WHERE id = :id'),
        {'data': data, 'id': tarefa_id},
    )


def test_progresso_exige_autenticacao(client):
    resposta = client.get('/api/v1/progresso/')

    assert resposta.status_code == 401
    assert resposta.headers['cache-control'] == 'no-store'


def test_progresso_vazio_retorna_periodo_e_disciplina_sem_tarefas(client):
    headers = criar_estudante(client, 'progresso-vazio@example.com')
    criar_disciplina(client, headers)

    with congelar_agora():
        resposta = client.get('/api/v1/progresso/?periodo=semana', headers=headers)

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados['periodo'] == 'semana'
    assert dados['intervalo'] == {'inicio': '2026-09-21', 'fim_exclusivo': '2026-09-28'}
    assert dados['indicadores']['tarefas_total'] == 0
    assert dados['indicadores']['progresso_geral_percentual'] is None
    assert dados['evolucao'] == [
        {'inicio': f'2026-09-{dia}', 'fim_exclusivo': f'2026-09-{int(dia) + 1:02d}',
         'rotulo': f'{dia}/09', 'conclusoes': 0}
        for dia in ('21', '22', '23', '24', '25', '26', '27')
    ]
    assert dados['disciplinas'][0]['progresso_percentual'] is None


def test_progresso_semanal_calcula_indicadores_e_isola_estudante(client, db):
    headers = criar_estudante(client, 'progresso-principal@example.com')
    disciplina_id = criar_disciplina(client, headers)
    concluida_no_periodo = criar_tarefa(
        client, headers, disciplina_id, status='concluido', vencimento='2026-09-22',
    )
    concluida_sem_data = criar_tarefa(client, headers, disciplina_id, status='concluido')
    criar_tarefa(client, headers, disciplina_id, vencimento='2026-09-20')
    definir_data_conclusao(db, concluida_no_periodo, '2026-09-22 15:00:00+00')
    definir_data_conclusao(db, concluida_sem_data, None)

    outro_estudante = criar_estudante(client, 'progresso-outro@example.com')
    outra_disciplina = criar_disciplina(client, outro_estudante, 'História')
    criar_tarefa(
        client, outro_estudante, outra_disciplina,
        status='concluido', vencimento='2026-09-22',
    )

    with congelar_agora():
        resposta = client.get('/api/v1/progresso/?periodo=semana', headers=headers)

    assert resposta.status_code == 200
    dados = resposta.json()
    indicadores = dados['indicadores']
    assert indicadores['tarefas_total'] == 3
    assert indicadores['tarefas_concluidas_total'] == 2
    assert indicadores['tarefas_atrasadas'] == 1
    assert indicadores['tarefas_concluidas_periodo'] == 1
    assert indicadores['progresso_geral_percentual'] == 66.7
    assert indicadores['tarefas_com_prazo_periodo'] == 1
    assert indicadores['tarefas_com_prazo_concluidas_periodo'] == 1
    assert dados['conclusoes_sem_data'] == 1
    assert dados['disciplinas'][0]['tarefas_total'] == 3
    assert dados['disciplinas'][0]['progresso_percentual'] == 66.7
    assert dados['disciplinas'][0]['conclusoes_periodo'] == 1
    assert dados['evolucao'][1]['conclusoes'] == 1
    assert sum(ponto['conclusoes'] for ponto in dados['evolucao']) == 1


def test_progresso_mensal_agrupa_evolucao_e_rejeita_periodo_invalido(client, db):
    headers = criar_estudante(client, 'progresso-mensal@example.com')
    disciplina_id = criar_disciplina(client, headers)
    concluida = criar_tarefa(
        client, headers, disciplina_id, status='concluido', vencimento='2026-09-15',
    )
    definir_data_conclusao(db, concluida, '2026-09-15 15:00:00+00')

    with congelar_agora():
        resposta = client.get('/api/v1/progresso/?periodo=mes', headers=headers)

    assert resposta.status_code == 200
    dados = resposta.json()
    assert dados['intervalo'] == {'inicio': '2026-09-01', 'fim_exclusivo': '2026-10-01'}
    assert len(dados['evolucao']) == 5
    assert dados['evolucao'][2]['rotulo'] == '14/09–20/09'
    assert dados['evolucao'][2]['conclusoes'] == 1
    assert dados['indicadores']['tarefas_concluidas_periodo'] == 1

    invalida = client.get('/api/v1/progresso/?periodo=ano', headers=headers)
    assert invalida.status_code == 422
