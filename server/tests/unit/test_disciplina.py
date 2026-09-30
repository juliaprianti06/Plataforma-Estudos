import pytest

def register_user(client, email="user@example.com"):
    response = client.post("/api/v1/auth/register", json={"name": "Test User", "email": email, "password": "password123"})
    if response.status_code == 201:
        return response.json()["access_token"]
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return response.json()["access_token"]

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def test_criar_disciplina(client):
    token = register_user(client, "disc1@example.com")
    headers = get_headers(token)
    
    payload = {
        "nome": "Matemática",
        "professor": "Prof. Carlos",
        "descricao": "Cálculo 1",
        "cor": "bg-blue-500"
    }
    response = client.post("/api/v1/disciplinas/", json=payload, headers=headers)
    
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == payload["nome"]
    assert "id" in data

def test_listar_disciplinas_retorna_apenas_do_usuario(client):
    token1 = register_user(client, "user1@example.com")
    token2 = register_user(client, "user2@example.com")
    
    client.post("/api/v1/disciplinas/", json={"nome": "Física", "professor": "", "cor": ""}, headers=get_headers(token1))
    
    res1 = client.get("/api/v1/disciplinas/", headers=get_headers(token1))
    assert len(res1.json()) == 1
    assert res1.json()[0]["nome"] == "Física"
    
    res2 = client.get("/api/v1/disciplinas/", headers=get_headers(token2))
    assert len(res2.json()) == 0

def test_atualizar_disciplina(client):
    token = register_user(client, "disc2@example.com")
    headers = get_headers(token)
    
    res = client.post("/api/v1/disciplinas/", json={"nome": "Química", "professor": "", "cor": ""}, headers=headers)
    disc_id = res.json()["id"]
    
    res_upd = client.put(f"/api/v1/disciplinas/{disc_id}", json={"nome": "Química Avançada"}, headers=headers)
    assert res_upd.status_code == 200
    assert res_upd.json()["nome"] == "Química Avançada"

def test_deletar_disciplina(client):
    token = register_user(client, "disc3@example.com")
    headers = get_headers(token)
    
    res = client.post("/api/v1/disciplinas/", json={"nome": "Biologia", "professor": "", "cor": ""}, headers=headers)
    disc_id = res.json()["id"]
    
    res_del = client.delete(f"/api/v1/disciplinas/{disc_id}", headers=headers)
    assert res_del.status_code == 204
    



@pytest.mark.parametrize('alteracao', [
    {'nome': ''}, {'nome': '   '}, {'nome': None}, {'cor': None}, {'ativo': None},
])
def test_rejeita_campos_obrigatorios_invalidos(client, alteracao):
    headers = get_headers(register_user(client, 'validacao@example.com'))
    original = client.post('/api/v1/disciplinas/', json={'nome': 'Original'}, headers=headers).json()
    response = client.put(f"/api/v1/disciplinas/{original['id']}", json=alteracao, headers=headers)
    assert response.status_code == 422
    assert client.get('/api/v1/disciplinas/', headers=headers).json() == [original]
    assert client.post('/api/v1/disciplinas/', json={'nome': 'Nova', **alteracao}, headers=headers).status_code == 422


def test_edicao_parcial_preserva_campos_e_permite_limpar_opcionais(client):
    headers = get_headers(register_user(client, 'parcial@example.com'))
    original = client.post('/api/v1/disciplinas/', json={
        'nome': '  Física  ', 'professor': 'Ana', 'descricao': 'Notas', 'ativo': False,
    }, headers=headers).json()
    assert original['nome'] == 'Física'
    response = client.put(f"/api/v1/disciplinas/{original['id']}", json={
        'nome': '  Física II  ', 'professor': None, 'descricao': None,
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['nome'] == 'Física II'
    assert data['professor'] is None and data['descricao'] is None
    assert data['ativo'] is False
    assert data['cor'] == original['cor']
