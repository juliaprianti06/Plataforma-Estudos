import base64
from io import BytesIO

import pytest
from PIL import Image
from sqlalchemy import select

from app.models.grupo import Grupo
from app.models.membro_grupo import MembroGrupo
from app.models.perfil_usuario import PerfilUsuario
from app.models.usuario import Usuario

URL = "/api/v1/profile/me"
DEFAULT = {"name": "Ana Silva", "bio": "", "interests": [], "avatar": None, "notifications": {"tasks": True, "groups": True}}


def account(client, email="ana@example.com"):
    response = client.post("/api/v1/auth/register", json={"name": "Ana Silva", "email": email, "password": "senha-segura-123"})
    assert response.status_code == 201
    data = response.json()
    return {"Authorization": "Bearer " + data["access_token"]}, int(data["user"]["id"])


def photo(format="WEBP", size=(320, 320)):
    buffer = BytesIO()
    Image.new("RGB", size, "purple").save(buffer, format=format)
    return "data:image/" + format.lower() + ";base64," + base64.b64encode(buffer.getvalue()).decode()


def test_existing_account_has_defaults_without_writing_a_profile(client, db):
    headers, user_id = account(client)
    response = client.get(URL, headers=headers)
    assert response.status_code == 200
    assert response.json() == DEFAULT | {"updatedAt": None}
    assert response.headers["Cache-Control"] == "no-store"
    assert db.get(PerfilUsuario, user_id) is None


def test_save_persists_fields_and_updates_name_in_auth(client, db):
    headers, user_id = account(client)
    payload = DEFAULT | {"name": "  Ana  Maria  ", "bio": " Estudando Python. ", "interests": ["Design", "Design", "Idiomas"], "avatar": photo(), "notifications": {"tasks": False, "groups": True}}
    response = client.put(URL, headers=headers, json=payload)
    assert response.status_code == 200, response.text
    saved = response.json()
    assert saved["name"] == "Ana Maria" and saved["bio"] == "Estudando Python."
    assert saved["interests"] == ["Design", "Idiomas"]
    assert saved["avatar"] == payload["avatar"] and saved["updatedAt"]
    assert saved["notifications"] == payload["notifications"]
    assert db.get(Usuario, user_id).nome == "Ana Maria"
    db.expire_all()
    assert client.get(URL, headers=headers).json() == saved
    assert client.get("/api/v1/auth/me", headers=headers).json()["name"] == "Ana Maria"
    second_login = client.post("/api/v1/auth/login", json={"email": "ana@example.com", "password": "senha-segura-123"})
    assert second_login.json()["user"]["name"] == "Ana Maria"
    second_headers = {"Authorization": "Bearer " + second_login.json()["access_token"]}
    assert client.get(URL, headers=second_headers).json() == saved


def test_reset_restores_original_name_and_preserves_account_groups_and_other_users(client, db):
    headers, user_id = account(client)
    other, other_id = account(client, "bia@example.com")
    group = Grupo(nome="Grupo de estudos")
    db.add(group)
    db.flush()
    db.add(MembroGrupo(id_grupo=group.id_grupo, id_usuario=user_id))
    db.commit()
    assert client.put(URL, headers=headers, json=DEFAULT | {"name": "Nome alterado", "bio": "Bio", "avatar": photo()}).status_code == 200
    assert client.put(URL, headers=headers, json=DEFAULT | {"name": "Segundo nome"}).status_code == 200
    assert client.put(URL, headers=other, json=DEFAULT | {"bio": "Perfil independente"}).status_code == 200
    assert client.delete(URL, headers=headers).json() == DEFAULT | {"updatedAt": None}
    assert db.get(PerfilUsuario, user_id) is None
    assert db.get(PerfilUsuario, other_id).bio == "Perfil independente"
    assert db.get(Usuario, user_id).ativo
    assert db.get(MembroGrupo, (group.id_grupo, user_id)) is not None
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 200
    assert client.delete(URL, headers=headers).json() == DEFAULT | {"updatedAt": None}


def test_export_only_contains_public_profile_and_own_email(client):
    headers, _ = account(client)
    saved = client.put(URL, headers=headers, json=DEFAULT | {"bio": "Meu perfil"}).json()
    response = client.get(URL + "/export", headers=headers)
    assert response.status_code == 200
    assert response.json() == saved | {"email": "ana@example.com"}
    assert "attachment" in response.headers["Content-Disposition"]
    assert "senha" not in response.text and "token" not in response.text and "nome_inicial" not in response.text


@pytest.mark.parametrize("method,path", [("get", URL), ("put", URL), ("delete", URL), ("get", URL+"/export")])
def test_profile_requires_active_session(client, method, path):
    options = {"json": DEFAULT} if method == "put" else {}
    assert getattr(client, method)(path, **options).status_code == 401
    headers, _ = account(client)
    assert client.post("/api/v1/auth/logout", headers=headers).status_code == 204
    assert getattr(client, method)(path, headers=headers, **options).status_code == 401


def test_users_cannot_read_or_change_another_profile(client):
    first, first_id = account(client)
    second, _ = account(client, "bia@example.com")
    client.put(URL, headers=first, json=DEFAULT | {"bio": "Privado"})
    assert client.get(URL, headers=second).json()["bio"] == ""
    assert client.put(URL, headers=second, json=DEFAULT | {"id_usuario": first_id}).status_code == 422
    assert client.get("/api/v1/profile/" + str(first_id), headers=second).status_code == 404
    assert client.get(URL + "/export", headers=second).json()["bio"] == ""


@pytest.mark.parametrize("change", [
    {"name": " "}, {"name": "x" * 101}, {"bio": "x" * 301},
    {"interests": ["Design", "Idiomas", "Ci\u00eancias", "Matem\u00e1tica"]},
    {"interests": ["Hacking"]}, {"interests": "Design"},
    {"notifications": {"tasks": "false", "groups": True}},
    {"notifications": {"tasks": True}}, {"notifications": {"tasks": True, "groups": True, "email": True}},
    {"avatar": "https://example.com/avatar.png"},
    {"avatar": "data:image/svg+xml;base64,PHN2Zy8+"},
    {"avatar": "data:image/png;base64,bm90LWFuLWltYWdl"},
    {"avatar": "data:image/png;base64,###"}, {"avatar": "x" * 300001},
    {"email": "changed@example.com"}, {"ativo": False}, {"senha_hash": "unsafe"},
])
def test_invalid_updates_are_rejected_atomically(client, db, change):
    headers, user_id = account(client)
    response = client.put(URL, headers=headers, json=DEFAULT | change)
    assert response.status_code == 422, response.text
    assert client.get(URL, headers=headers).json() == DEFAULT | {"updatedAt": None}
    assert db.get(PerfilUsuario, user_id) is None


@pytest.mark.parametrize("format", ["JPEG", "PNG", "WEBP"])
def test_supported_photos_can_be_saved_and_removed(client, format):
    headers, _ = account(client)
    avatar = photo(format)
    response = client.put(URL, headers=headers, json=DEFAULT | {"avatar": avatar})
    assert response.status_code == 200, response.text
    assert response.json()["avatar"] == avatar
    assert client.put(URL, headers=headers, json=DEFAULT).json()["avatar"] is None


def test_rejects_spoofed_mime_and_oversized_dimensions(client):
    headers, _ = account(client)
    for avatar in [photo("PNG").replace("image/png", "image/jpeg"), photo("PNG", (1025, 1))]:
        assert client.put(URL, headers=headers, json=DEFAULT | {"avatar": avatar}).status_code == 422


def test_inactive_user_cannot_change_profile(client, db):
    headers, user_id = account(client)
    db.get(Usuario, user_id).ativo = False
    db.commit()
    assert client.put(URL, headers=headers, json=DEFAULT).status_code == 401
    assert db.scalar(select(PerfilUsuario).where(PerfilUsuario.id_usuario == user_id)) is None


def test_rejects_corrupt_png_and_animated_webp(client):
    headers, _ = account(client)
    raw = bytearray(base64.b64decode(photo("PNG").split(",", 1)[1]))
    # Corrupt the CRC of the IDAT chunk, leaving the PNG header recognizable.
    chunk_start = raw.index(b"IDAT")
    chunk_length = int.from_bytes(raw[chunk_start-4:chunk_start], "big")
    raw[chunk_start + 4 + chunk_length] ^= 1
    corrupt = "data:image/png;base64," + base64.b64encode(raw).decode()
    buffer = BytesIO()
    Image.new("RGB", (10, 10), "red").save(buffer, format="WEBP", save_all=True, append_images=[Image.new("RGB", (10, 10), "blue")], duration=100, loop=0)
    animated = "data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode()
    for avatar in [corrupt, animated]:
        assert client.put(URL, headers=headers, json=DEFAULT | {"avatar": avatar}).status_code == 422
