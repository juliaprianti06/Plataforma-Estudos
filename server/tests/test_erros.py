import pytest
from fastapi.testclient import TestClient

from app.main import app

BASE = "/api/v1/auth"


def _campos(response):
    return {c["campo"]: c for c in response.json()["campos"]}


def test_422_traz_mensagem_por_campo(client):
    response = client.post(BASE + "/register", json={})
    assert response.status_code == 422
    body = response.json()
    assert body["erro"] == "DADOS_INVALIDOS"
    campos = _campos(response)
    assert set(campos) == {"name", "email", "password"}
    assert all(c["mensagem"] for c in campos.values())
    assert campos["email"]["mensagem"] == "Campo obrigatório."


def test_422_email_invalido_tem_mensagem_clara(client):
    payload = {"name": "Ana Silva", "email": "invalido", "password": "senha-segura-123"}
    response = client.post(BASE + "/register", json=payload)
    assert response.status_code == 422
    assert _campos(response)["email"]["mensagem"] == "Informe um e-mail válido."


def test_422_senha_curta_nao_vaza_senha(client):
    payload = {"name": "Ana Silva", "email": "ana@example.com", "password": "12345"}
    response = client.post(BASE + "/register", json=payload)
    assert response.status_code == 422
    assert _campos(response)["password"]["mensagem"] == "Deve ter no mínimo 6 caracteres."
    assert "12345" not in response.text

def test_login_sem_campos_retorna_422_padronizado(client):
    response = client.post(BASE + "/login", json={})
    assert response.status_code == 422
    assert {"email", "password"} <= set(_campos(response))


def test_json_malformado_retorna_422_padronizado(client):
    response = client.post(
        BASE + "/login", content="{oops", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
    assert response.json()["erro"] == "DADOS_INVALIDOS"


def test_rota_inexistente_segue_formato_padrao(client):
    response = client.get("/api/v1/nao-existe")
    assert response.status_code == 404
    assert response.json() == {"erro": "NAO_ENCONTRADO", "mensagem": "Recurso não encontrado."}


def test_metodo_nao_permitido_segue_formato_padrao(client):
    response = client.get(BASE + "/login")
    assert response.status_code == 405
    assert response.json()["erro"] == "METODO_NAO_PERMITIDO"


def test_erro_inesperado_retorna_500_padronizado_sem_detalhes():
    async def boom():
        raise RuntimeError("segredo interno")

    app.add_api_route("/__boom", boom, methods=["GET"])
    try:
        with TestClient(app, raise_server_exceptions=False) as c:
            response = c.get("/__boom")
    finally:
        app.router.routes.pop()
    assert response.status_code == 500
    assert response.json()["erro"] == "ERRO_INTERNO"
    assert "segredo interno" not in response.text