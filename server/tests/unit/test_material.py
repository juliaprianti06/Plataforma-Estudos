import pytest
import os
from app.services import storage_service
from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def uploads_temporarios(tmp_path, monkeypatch):
    monkeypatch.setattr(storage_service, 'UPLOAD_DIR', tmp_path)


@pytest.fixture
def material_criado(client, auth_token):
    response = client.post('/api/v1/disciplinas/', json={'nome': 'Material de teste'}, headers=auth_token)
    assert response.status_code == 201
    response = client.post('/api/v1/materiais/', headers=auth_token,
                           data={'titulo': 'Original', 'disciplina_id': response.json()['id']},
                           files={'file': ('teste.txt', b'conteudo', 'text/plain')})
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def auth_token(client: TestClient):
    client.post("/api/v1/auth/register", json={
        "name": "User Material",
        "email": "material@example.com",
        "password": "password123"
    })
    res = client.post("/api/v1/auth/login", json={
        "email": "material@example.com",
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_upload_material_sucesso(client: TestClient, db, auth_token: dict):
    response = client.post(
        "/api/v1/disciplinas/",
        headers=auth_token,
        json={"nome": "Física", "descricao": "Mecânica Clássica"}
    )
    disciplina_id = response.json()["id"]

    test_file_path = "test_upload.txt"
    with open(test_file_path, "w") as f:
        f.write("Conteúdo de teste para upload de material.")

    try:
        with open(test_file_path, "rb") as f:
            response = client.post(
                "/api/v1/materiais/",
                headers=auth_token,
                data={
                    "disciplina_id": disciplina_id,
                    "titulo": "Resumo de Física",
                    "descricao": "Resumo do capítulo 1",
                    "tipo": "documento"
                },
                files={"file": ("test_upload.txt", f, "text/plain")}
            )
        
        assert response.status_code == 201
        data = response.json()
        assert data["titulo"] == "Resumo de Física"
        assert data["disciplina_id"] == disciplina_id
        assert "url_arquivo" in data
        assert data["content_type"] == "text/plain"
        assert data["tamanho_bytes"] > 0
        
        file_disk_path = storage_service.UPLOAD_DIR / data["url_arquivo"].split("/")[-1]
        assert file_disk_path.is_file()
    finally:
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_listar_materiais(client: TestClient, db, auth_token: dict):
    response = client.get("/api/v1/materiais/", headers=auth_token)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_atualizar_material(client: TestClient, db, auth_token: dict, material_criado):
    mat_id = material_criado["id_material"]
    response = client.put(
        f"/api/v1/materiais/{mat_id}",
        headers=auth_token,
        json={"titulo": "Título Atualizado"}
    )
    assert response.status_code == 200
    assert response.json()["titulo"] == "Título Atualizado"

def test_deletar_material(client: TestClient, db, auth_token: dict, material_criado):
    mat_id = material_criado["id_material"]
    response = client.delete(
        f"/api/v1/materiais/{mat_id}",
        headers=auth_token
    )
    assert response.status_code == 204

    res_verify = client.get("/api/v1/materiais/", headers=auth_token)
    ids = [m["id_material"] for m in res_verify.json()]
    assert mat_id not in ids
