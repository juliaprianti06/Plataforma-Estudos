from uuid import UUID

import pytest
from sqlalchemy import func, select

from app.models.sessao_estudo import SessaoEstudo


def estudante(client, email='sessoes@example.com'):
    resposta = client.post('/api/v1/auth/register', json={
        'name': 'Estudante', 'email': email, 'password': 'password123',
    })
    assert resposta.status_code == 201
    return {'Authorization': f"Bearer {resposta.json()['access_token']}"}


def disciplina(client, headers, nome='Matemática'):
    resposta = client.post('/api/v1/disciplinas/', headers=headers, json={'nome': nome, 'cor': 'bg-success'})
    assert resposta.status_code == 201
    return resposta.json()['id']


def dados(disciplina_id, **alteracoes):
    return {'disciplina_id': disciplina_id, 'data': '2026-11-21', 'inicio': '14:00', 'termino': '15:30',
            'observacao': '  Revisão de conteúdo  ', **alteracoes}


def criar(client, headers, disciplina_id, **alteracoes):
    resposta = client.post('/api/v1/sessoes-estudo/', headers=headers, json={**dados(disciplina_id), **alteracoes})
    assert resposta.status_code == 201, resposta.text
    assert resposta.headers['cache-control'] == 'no-store'
    return resposta.json()


@pytest.mark.parametrize('metodo,caminho', [
    ('get', '/api/v1/sessoes-estudo/'),
    ('post', '/api/v1/sessoes-estudo/'),
    ('put', '/api/v1/sessoes-estudo/00000000-0000-0000-0000-000000000001'),
    ('delete', '/api/v1/sessoes-estudo/00000000-0000-0000-0000-000000000001'),
])
def test_sessoes_exigem_autenticacao(client, metodo, caminho):
    parametros = {'json': dados(1)} if metodo in ('post', 'put') else {}
    resposta = getattr(client, metodo)(caminho, **parametros)
    assert resposta.status_code == 401


def test_usuario_inicia_sem_sessoes_e_consultas_nao_criam_exemplos(client, db):
    headers = estudante(client)
    disciplina(client, headers)
    for _ in range(2):
        resposta = client.get('/api/v1/sessoes-estudo/', headers=headers)
        assert resposta.status_code == 200
        assert resposta.json() == []
        assert resposta.headers['cache-control'] == 'no-store'
    assert db.scalar(select(func.count()).select_from(SessaoEstudo)) == 0


def test_persiste_reconsulta_edita_e_exclui_sessao(client, db):
    headers = estudante(client)
    disciplina_id = disciplina(client, headers)
    sessao = criar(client, headers, disciplina_id)
    assert str(UUID(sessao['id'])) == sessao['id']
    assert sessao['inicio'] == '14:00'
    assert sessao['termino'] == '15:30'
    assert sessao['duracaoMinutos'] == 90
    assert sessao['observacao'] == 'Revisão de conteúdo'
    assert sessao['disciplina'] == {'id': disciplina_id, 'nome': 'Matemática', 'cor': 'bg-success'}
    assert db.scalar(select(SessaoEstudo.duracao_minutos).where(SessaoEstudo.id == sessao['id'])) == 90
    db.expire_all()
    assert client.get('/api/v1/sessoes-estudo/', headers=headers).json() == [sessao]

    outra_disciplina = disciplina(client, headers, 'Português')
    resposta = client.put(f"/api/v1/sessoes-estudo/{sessao['id']}", headers=headers,
                          json=dados(outra_disciplina, inicio='08:45', termino='10:00', observacao=''))
    assert resposta.status_code == 200
    atualizada = resposta.json()
    assert atualizada['id'] == sessao['id']
    assert atualizada['duracaoMinutos'] == 75
    assert atualizada['disciplina']['id'] == outra_disciplina
    assert atualizada['observacao'] == ''
    db.expire_all()
    assert client.get('/api/v1/sessoes-estudo/', headers=headers).json() == [atualizada]
    assert client.delete(f"/api/v1/sessoes-estudo/{sessao['id']}", headers=headers).status_code == 204
    assert client.get('/api/v1/sessoes-estudo/', headers=headers).json() == []
    assert db.scalar(select(func.count()).select_from(SessaoEstudo)) == 0


def test_ordena_por_data_e_horario_e_usa_disciplina_atual(client):
    headers = estudante(client)
    disciplina_id = disciplina(client, headers)
    antiga = criar(client, headers, disciplina_id, data='2026-11-20')
    manha = criar(client, headers, disciplina_id, inicio='08:00', termino='09:00')
    tarde = criar(client, headers, disciplina_id)
    assert client.put(f'/api/v1/disciplinas/{disciplina_id}', headers=headers,
                      json={'nome': 'Cálculo', 'cor': 'bg-accent'}).status_code == 200
    sessoes = client.get('/api/v1/sessoes-estudo/', headers=headers).json()
    assert [item['id'] for item in sessoes] == [tarde['id'], manha['id'], antiga['id']]
    assert all(item['disciplina']['nome'] == 'Cálculo' and item['disciplina']['cor'] == 'bg-accent' for item in sessoes)


def test_isola_usuarios_e_impede_associacao_a_disciplina_de_outra_conta(client):
    dono = estudante(client, 'dono-sessao@example.com')
    disciplina_dono = disciplina(client, dono)
    sessao = criar(client, dono, disciplina_dono)
    outro = estudante(client, 'outro-sessao@example.com')
    disciplina_outro = disciplina(client, outro)
    assert client.get('/api/v1/sessoes-estudo/', headers=outro).json() == []
    assert client.post('/api/v1/sessoes-estudo/', headers=outro, json=dados(disciplina_dono)).status_code == 404
    assert client.put(f"/api/v1/sessoes-estudo/{sessao['id']}", headers=outro,
                      json=dados(disciplina_outro)).status_code == 404
    assert client.delete(f"/api/v1/sessoes-estudo/{sessao['id']}", headers=outro).status_code == 404
    assert client.put(f"/api/v1/sessoes-estudo/{sessao['id']}", headers=dono,
                      json=dados(disciplina_outro)).status_code == 404
    assert client.get('/api/v1/sessoes-estudo/', headers=dono).json() == [sessao]


@pytest.mark.parametrize('alteracoes', [
    {'termino': '13:00'}, {'termino': '14:00'}, {'inicio': '25:00'}, {'inicio': '14:00:30'},
    {'inicio': '14:00:00+03:00'}, {'data': '2026-02-30'}, {'disciplina_id': 0},
    {'observacao': 'x' * 4001}, {'duracaoMinutos': 999}, {'usuario_id': 999},
    {'id': '00000000-0000-0000-0000-000000000001'},
])
def test_rejeita_dados_invalidos_e_campos_controlados_pelo_servidor(client, alteracoes):
    headers = estudante(client)
    disciplina_id = disciplina(client, headers)
    resposta = client.post('/api/v1/sessoes-estudo/', headers=headers, json=dados(disciplina_id, **alteracoes))
    assert resposta.status_code == 422
    assert client.get('/api/v1/sessoes-estudo/', headers=headers).json() == []


def test_edicao_invalida_nao_altera_dados_e_id_inexistente_retorna_404(client):
    headers = estudante(client)
    disciplina_id = disciplina(client, headers)
    sessao = criar(client, headers, disciplina_id)
    assert client.put(f"/api/v1/sessoes-estudo/{sessao['id']}", headers=headers,
                      json=dados(disciplina_id, termino='13:00')).status_code == 422
    assert client.get('/api/v1/sessoes-estudo/', headers=headers).json() == [sessao]
    inexistente = '/api/v1/sessoes-estudo/00000000-0000-0000-0000-000000000001'
    assert client.put(inexistente, headers=headers, json=dados(disciplina_id)).status_code == 404
    assert client.delete(inexistente, headers=headers).status_code == 404


def test_excluir_disciplina_remove_suas_sessoes(client, db):
    headers = estudante(client)
    disciplina_id = disciplina(client, headers)
    criar(client, headers, disciplina_id)
    assert client.delete(f'/api/v1/disciplinas/{disciplina_id}', headers=headers).status_code == 204
    assert client.get('/api/v1/sessoes-estudo/', headers=headers).json() == []
    assert db.scalar(select(func.count()).select_from(SessaoEstudo)) == 0
