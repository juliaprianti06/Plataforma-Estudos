import pytest
from sqlalchemy import func, select
from app.models.coluna_kanban import ColunaKanban
from app.models.grupo import Grupo
from app.models.membro_grupo import MembroGrupo

DATA = {"name": "Clube Python", "description": "Estudando Python em comunidade", "category": "Programa\u00e7\u00e3o", "icon": "laptop"}


def account(client, email):
    response = client.post("/api/v1/auth/register", json={"name": "Estudante", "email": email, "password": "senha-segura-123"})
    assert response.status_code == 201
    return {"Authorization": "Bearer " + response.json()["access_token"]}


def test_create_assigns_admin_and_columns_and_survives_new_reads(client, db):
    owner = account(client, "owner@example.com")
    result = client.post("/api/v1/groups", headers=owner, json=DATA)
    assert result.status_code == 201, result.text
    group = result.json()
    assert group["role"] == "admin" and group["members"] == 1
    assert len(group["inviteCode"]) == 6
    db.expire_all()
    assert client.get("/api/v1/groups", headers=owner).json() == [group]
    assert db.scalar(select(func.count()).select_from(ColunaKanban).where(ColunaKanban.id_grupo == int(group["id"]))) == 3


def test_discover_join_invite_edit_and_permissions(client):
    owner = account(client, "owner@example.com")
    member = account(client, "member@example.com")
    stranger = account(client, "stranger@example.com")
    group = client.post("/api/v1/groups", headers=owner, json=DATA | {"inviteCode": "PYTH42"}).json()
    path = "/api/v1/groups/" + group["id"]
    previews = client.get("/api/v1/groups/discover", headers=member).json()
    assert len(previews) == 1 and "inviteCode" not in previews[0]
    assert client.get("/api/v1/groups", headers=member).json() == []
    assert client.put(path, headers=stranger, json=DATA).status_code == 404
    joined = client.post("/api/v1/groups/join", headers=member, json={"code": "py-th42"})
    assert joined.status_code == 200 and joined.json()["members"] == 2
    assert joined.json()["role"] == "member"
    assert client.post(path + "/join", headers=member).status_code == 409
    assert client.put(path, headers=member, json=DATA).status_code == 403
    assert client.put(path, headers=owner, json=DATA | {"name": "Novo grupo"}).status_code == 200
    assert client.get("/api/v1/groups", headers=member).json()[0]["name"] == "Novo grupo"
    assert client.get("/api/v1/groups/discover", headers=member).json() == []
    assert client.post(path + "/join", headers=stranger).json()["members"] == 3
    assert client.get("/api/v1/groups", headers=owner).json()[0]["members"] == 3


def test_duplicate_code_rolls_back_group_and_membership(client, db):
    owner = account(client, "owner@example.com")
    assert client.post("/api/v1/groups", headers=owner, json=DATA | {"inviteCode": "PYTH42"}).status_code == 201
    assert client.post("/api/v1/groups", headers=owner, json=DATA | {"inviteCode": "PYTH42"}).status_code == 409
    assert db.scalar(select(func.count()).select_from(Grupo)) == 1
    assert db.scalar(select(func.count()).select_from(MembroGrupo)) == 1


@pytest.mark.parametrize("payload", [{"name": "a"}, {"name": "a"*61}, {"description": "short"}, {"category": "invalid"}, {"icon": "invalid"}, {"role": "admin"}, {"id_usuario": 2}, {"inviteCode": "INVALID-LENGTH"}])
def test_invalid_group_data_cannot_change_database(client, db, payload):
    owner = account(client, "owner@example.com")
    assert client.post("/api/v1/groups", headers=owner, json=DATA | payload).status_code == 422
    assert db.scalar(select(func.count()).select_from(Grupo)) == 0


def test_unknown_invite_and_authentication(client):
    owner = account(client, "owner@example.com")
    assert client.get("/api/v1/groups").status_code == 401
    assert client.post("/api/v1/groups", json=DATA).status_code == 401
    assert client.get("/api/v1/groups/discover").status_code == 401
    assert client.post("/api/v1/groups/join", headers=owner, json={"code": "XXXXX1"}).status_code == 404
    client.post("/api/v1/auth/logout", headers=owner)
    assert client.post("/api/v1/groups/join", headers=owner, json={"code": "XXXXX1"}).status_code == 401
