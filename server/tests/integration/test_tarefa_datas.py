from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from sqlalchemy import text


@pytest.fixture
def tarefa_context(client):
    response = client.post('/api/v1/auth/register', json={
        'name': 'Estudante', 'email': 'datas@example.com', 'password': 'password123',
    })
    assert response.status_code == 201
    headers = {'Authorization': f"Bearer {response.json()['access_token']}"}
    response = client.post('/api/v1/disciplinas/', json={'nome': 'Matemática'}, headers=headers)
    assert response.status_code == 201
    return headers, {'nome': 'Estudar', 'prioridade': 'Alta', 'disciplina_id': response.json()['id']}


@pytest.mark.parametrize('status', ['a_fazer', 'em_andamento', 'concluido'])
def test_criacao_registra_datas_utc(client, tarefa_context, status):
    headers, payload = tarefa_context
    antes = datetime.now(timezone.utc)
    response = client.post('/api/v1/tarefas/', json={**payload, 'status': status}, headers=headers)
    assert response.status_code == 200
    tarefa = response.json()
    criado = datetime.fromisoformat(tarefa['criado_em'])
    assert criado.utcoffset().total_seconds() == 0
    assert antes <= criado <= datetime.now(timezone.utc)
    assert tarefa['concluido_em'] == (tarefa['criado_em'] if status == 'concluido' else None)


@pytest.mark.parametrize('status_reaberto', ['a_fazer', 'em_andamento'])
def test_conclusao_edicao_reabertura_e_nova_conclusao(client, tarefa_context, status_reaberto):
    headers, payload = tarefa_context
    response = client.post('/api/v1/tarefas/', json=payload, headers=headers)
    assert response.status_code == 200
    original = response.json()
    url = f"/api/v1/tarefas/{original['id']}"
    primeira = datetime(2026, 9, 23, 12, tzinfo=timezone.utc)
    segunda = datetime(2026, 9, 24, 12, tzinfo=timezone.utc)

    with patch('app.commands.tarefa.update_tarefa_command.datetime') as relogio:
        relogio.now.return_value = primeira
        response = client.put(url, json={'status': 'concluido'}, headers=headers)
        assert response.status_code == 200
        assert datetime.fromisoformat(response.json()['concluido_em']) == primeira

        relogio.now.return_value = segunda
        for alteracao in ({'nome': 'Novo nome'}, {'status': 'concluido'}):
            response = client.put(url, json=alteracao, headers=headers)
            assert response.status_code == 200
            assert datetime.fromisoformat(response.json()['concluido_em']) == primeira
            assert response.json()['criado_em'] == original['criado_em']

        response = client.put(url, json={'status': status_reaberto}, headers=headers)
        assert response.status_code == 200
        assert response.json()['concluido_em'] is None
        response = client.put(url, json={'status': 'concluido'}, headers=headers)
        assert response.status_code == 200
        assert datetime.fromisoformat(response.json()['concluido_em']) == segunda
        assert response.json()['criado_em'] == original['criado_em']

    response = client.get(f"/api/v1/tarefas/disciplina/{payload['disciplina_id']}", headers=headers)
    assert response.status_code == 200
    assert datetime.fromisoformat(response.json()[0]['concluido_em']) == segunda


def test_editar_tarefa_legada_nao_inventa_datas(client, db, tarefa_context):
    headers, payload = tarefa_context
    response = client.post('/api/v1/tarefas/', json={**payload, 'status': 'concluido'}, headers=headers)
    assert response.status_code == 200
    tarefa_id = response.json()['id']
    db.execute(text('UPDATE tarefas SET criado_em = NULL, concluido_em = NULL WHERE id = :id'), {'id': tarefa_id})
    db.commit()
    db.expire_all()

    response = client.put(f'/api/v1/tarefas/{tarefa_id}', json={'nome': 'Legada', 'status': 'concluido'}, headers=headers)
    assert response.status_code == 200
    assert response.json()['criado_em'] is None
    assert response.json()['concluido_em'] is None


def test_datas_nao_podem_ser_definidas_pelo_cliente(client, tarefa_context):
    headers, payload = tarefa_context
    datas = {'criado_em': '2000-01-01T00:00:00Z', 'concluido_em': '2000-01-01T00:00:00Z'}
    response = client.post('/api/v1/tarefas/', json={**payload, **datas}, headers=headers)
    assert response.status_code == 200
    original = response.json()
    assert datetime.fromisoformat(original['criado_em']).year != 2000
    assert original['concluido_em'] is None
    response = client.put(f"/api/v1/tarefas/{original['id']}", json=datas, headers=headers)
    assert response.status_code == 200
    assert response.json()['criado_em'] == original['criado_em']
    assert response.json()['concluido_em'] is None
