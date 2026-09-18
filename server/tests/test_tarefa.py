import pytest

def register_user(client, email="user_tarefa@example.com"):
    response = client.post("/api/v1/auth/register", json={"name": "Test User", "email": email, "password": "password123"})
    if response.status_code == 201:
        return response.json()["access_token"]
    response = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return response.json()["access_token"]

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def criar_disciplina_helper(client, headers):
    res = client.post("/api/v1/disciplinas/", json={"nome": "Disc Tarefa", "professor": "", "cor": ""}, headers=headers)
    return res.json()["id"]

def test_criar_tarefa(client):
    token = register_user(client, "tarefa1@example.com")
    headers = get_headers(token)
    disc_id = criar_disciplina_helper(client, headers)
    
    payload = {
        "nome": "Estudar Testes",
        "prioridade": "Alta",
        "data_vencimento": "2026-10-10",
        "status": "a_fazer",
        "disciplina_id": disc_id,
        "id_coluna": None
    }
    response = client.post("/api/v1/tarefas/", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == payload["nome"]
    assert data["disciplina_id"] == disc_id
    assert "id" in data

def test_listar_tarefas_da_disciplina(client):
    token1 = register_user(client, "tarefa2@example.com")
    token2 = register_user(client, "tarefa_outro@example.com")
    headers1 = get_headers(token1)
    
    disc_id = criar_disciplina_helper(client, headers1)
    
    # Criar tarefa
    client.post("/api/v1/tarefas/", json={
        "nome": "Ler livro", "prioridade": "Média", "data_vencimento": None, "status": "a_fazer", "disciplina_id": disc_id, "id_coluna": None
    }, headers=headers1)
    
    # Usuario dono lista
    res1 = client.get(f"/api/v1/tarefas/disciplina/{disc_id}", headers=headers1)
    assert len(res1.json()) == 1
    assert res1.json()[0]["nome"] == "Ler livro"
    
    # Usuario não dono lista (não deve acessar, dependendo da regra, mas no minimo retorna 0 ou 404/403)
    res2 = client.get(f"/api/v1/tarefas/disciplina/{disc_id}", headers=get_headers(token2))
    assert len(res2.json()) == 0

def test_atualizar_tarefa(client):
    token = register_user(client, "tarefa3@example.com")
    headers = get_headers(token)
    disc_id = criar_disciplina_helper(client, headers)
    
    res = client.post("/api/v1/tarefas/", json={
        "nome": "Fazer TP", "prioridade": "Baixa", "data_vencimento": None, "status": "a_fazer", "disciplina_id": disc_id, "id_coluna": None
    }, headers=headers)
    tarefa_id = res.json()["id"]
    
    res_upd = client.put(f"/api/v1/tarefas/{tarefa_id}", json={"status": "concluido"}, headers=headers)
    assert res_upd.status_code == 200
    assert res_upd.json()["status"] == "concluido"
    assert res_upd.json()["nome"] == "Fazer TP" # Mantém os outros campos intactos

def test_deletar_tarefa(client):
    token = register_user(client, "tarefa4@example.com")
    headers = get_headers(token)
    disc_id = criar_disciplina_helper(client, headers)
    
    res = client.post("/api/v1/tarefas/", json={
        "nome": "Excluir depois", "prioridade": "Média", "data_vencimento": None, "status": "a_fazer", "disciplina_id": disc_id, "id_coluna": None
    }, headers=headers)
    tarefa_id = res.json()["id"]
    
    res_del = client.delete(f"/api/v1/tarefas/{tarefa_id}", headers=headers)
    assert res_del.status_code == 200
    
    res_get = client.get(f"/api/v1/tarefas/disciplina/{disc_id}", headers=headers)
    assert len(res_get.json()) == 0
