from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from sqlalchemy import select

from app.config import get_settings
from app.core.security import ALGORITHM, decode_access_token, verify_password
from app.models.sessao_auth import SessaoAuth
from app.models.usuario import Usuario
from app.services import auth_service

BASE = "/api/v1/auth"
ACCOUNT = {"name": "Ana Silva", "email": "ana@example.com", "password": "senha-segura-123"}


def register(client, **changes):
    response = client.post(BASE + "/register", json=ACCOUNT | changes)
    assert response.status_code == 201, response.text
    return response.json()


def bearer(data):
    return {"Authorization": "Bearer " + data["access_token"]}


def test_register_persists_hash_and_matches_frontend_contract(client, db):
    data = register(client, name="  Ana Silva  ", email=" ANA@EXAMPLE.COM ")
    assert data["user"] == {"id": data["user"]["id"], "name": "Ana Silva", "email": ACCOUNT["email"]}
    assert isinstance(data["user"]["id"], str) and data["user"]["id"].isdigit()
    assert data["expires_in"] == 3600
    assert data["token_type"] == "bearer"
    user = db.get(Usuario, int(data["user"]["id"]))
    assert user.login == ACCOUNT["email"]
    assert user.senha_hash.startswith("$argon2id$")
    assert verify_password(ACCOUNT["password"], user.senha_hash)
    assert "senha_hash" not in str(data) and ACCOUNT["password"] not in str(data)
    claims = decode_access_token(data["access_token"])
    assert claims["sub"] == data["user"]["id"]
    assert claims["exp"] - claims["iat"] == data["expires_in"]
    assert db.get(SessaoAuth, claims["jti"]) is not None
    response = client.get(BASE + "/me", headers=bearer(data))
    assert response.status_code == 200 and response.json() == data["user"]
    assert response.headers["Cache-Control"] == "no-store"


def test_login_normalizes_email_and_logout_revokes_only_current_session(client, db):
    first = register(client)
    response = client.post(BASE + "/login", json={"email": " ANA@EXAMPLE.COM ", "password": ACCOUNT["password"]})
    assert response.status_code == 200
    second = response.json()
    assert first["access_token"] != second["access_token"]
    assert first["user"] == second["user"]
    assert client.post(BASE + "/logout", headers=bearer(first)).status_code == 204
    assert client.get(BASE + "/me", headers=bearer(first)).status_code == 401
    assert client.post(BASE + "/logout", headers=bearer(first)).status_code == 401
    assert client.get(BASE + "/me", headers=bearer(second)).status_code == 200
    assert db.get(SessaoAuth, decode_access_token(first["access_token"])["jti"]).revogado_em is not None


@pytest.mark.parametrize("email,password", [(ACCOUNT["email"], "senha-errada"), ("unknown@example.com", ACCOUNT["password"])])
def test_invalid_credentials_return_401_without_sensitive_data(client, email, password):
    register(client)
    response = client.post(BASE + "/login", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert response.json()["erro"] == "NAO_AUTENTICADO"
    assert password not in response.text


def test_duplicate_email_is_case_insensitive(client):
    register(client)
    response = client.post(BASE + "/register", json=ACCOUNT | {"email": "ANA@EXAMPLE.COM"})
    assert response.status_code == 409
    assert response.json()["erro"] == "CONFLITO"


def test_unique_constraint_race_rolls_back_and_connection_remains_usable(client, db, monkeypatch):
    data = register(client)
    # Force the lookup to miss an existing account, as in a registration race.
    monkeypatch.setattr(auth_service, "get_by_email", lambda *_: None)
    assert client.post(BASE + "/register", json=ACCOUNT).status_code == 409
    assert len(db.scalars(select(Usuario)).all()) == 1
    assert client.get(BASE + "/me", headers=bearer(data)).status_code == 200


@pytest.mark.parametrize("changes", [
    {"name": " "}, {"name": "a" * 101}, {"email": "invalid"},
    {"email": "a" * 64 + "@" + "b" * 30 + ".example.com"},
    {"password": "12345"}, {"password": "x" * 129}, {"ativo": True},
])
def test_registration_validation_does_not_echo_password(client, changes):
    payload = ACCOUNT | changes
    response = client.post(BASE + "/register", json=payload)
    assert response.status_code == 422
    assert payload["password"] not in response.text
    assert "input" not in response.text


def test_email_longer_than_original_login_limit_is_supported(client):
    email = "a" * 55 + "@example.com"
    assert register(client, email=email)["user"]["email"] == email


@pytest.mark.parametrize("header", [None, "Basic abc", "Bearer invalid.token.value"])
def test_missing_or_malformed_bearer_is_rejected(client, header):
    headers = {"Authorization": header} if header else {}
    assert client.get(BASE + "/me", headers=headers).status_code == 401
    assert client.post(BASE + "/logout", headers=headers).status_code == 401


@pytest.mark.parametrize("change", ["expired", "wrong_signature", "wrong_audience", "unknown_session", "wrong_user", "missing_exp"])
def test_invalid_signed_tokens_are_rejected(client, change):
    data = register(client)
    claims = decode_access_token(data["access_token"])
    secret = get_settings().jwt_secret.get_secret_value()
    if change == "expired":
        claims["exp"] = int((datetime.now(timezone.utc) - timedelta(seconds=1)).timestamp())
    elif change == "wrong_signature":
        secret = "a-different-secret-that-is-at-least-32-characters"
    elif change == "wrong_audience":
        claims["aud"] = "another-application"
    elif change == "unknown_session":
        claims["jti"] = str(uuid4())
    elif change == "wrong_user":
        claims["sub"] = str(int(claims["sub"]) + 1)
    else:
        del claims["exp"]
    token = jwt.encode(claims, secret, algorithm=ALGORITHM)
    assert client.get(BASE + "/me", headers={"Authorization": "Bearer " + token}).status_code == 401


def test_database_session_expiry_is_enforced(client, db):
    data = register(client)
    session = db.get(SessaoAuth, decode_access_token(data["access_token"])["jti"])
    session.expira_em = datetime.now(timezone.utc) - timedelta(seconds=1)
    db.commit()
    assert client.get(BASE + "/me", headers=bearer(data)).status_code == 401


def test_inactive_user_cannot_login_or_use_existing_token(client, db):
    data = register(client)
    db.get(Usuario, int(data["user"]["id"])).ativo = False
    db.commit()
    assert client.get(BASE + "/me", headers=bearer(data)).status_code == 401
    response = client.post(BASE + "/login", json={"email": ACCOUNT["email"], "password": ACCOUNT["password"]})
    assert response.status_code == 401


def test_cors_allows_frontend_bearer_requests_and_rejects_other_origins(client):
    headers = {"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type"}
    response = client.options(BASE + "/login", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == headers["Origin"]
    response = client.options(BASE + "/login", headers=headers | {"Origin": "https://untrusted.example"})
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
