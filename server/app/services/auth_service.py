from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.exceptions import ConflitoError, NaoAutenticadoError
from app.core.security import DUMMY_HASH, create_access_token, decode_access_token, hash_password, verify_password
from app.models.sessao_auth import SessaoAuth
from app.models.usuario import Usuario
from app.repository.usuario_repository import get_by_email
from app.schemas.auth_schema import AuthUser, LoginRequest, RegisterRequest, TokenResponse


@dataclass
class AuthContext:
    user: Usuario
    session: SessaoAuth


def public_user(user: Usuario) -> AuthUser:
    return AuthUser(id=str(user.id_usuario), name=user.nome, email=user.email)


def _new_session(db: Session, user: Usuario) -> TokenResponse:
    expires_in = get_settings().access_token_expire_minutes * 60
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    session = SessaoAuth(
        id_sessao=str(uuid4()), id_usuario=user.id_usuario, expira_em=expires_at,
    )
    db.add(session)
    token = create_access_token(user.id_usuario, session.id_sessao, expires_at)
    db.commit()
    return TokenResponse(access_token=token, expires_in=expires_in, user=public_user(user))


def register(db: Session, data: RegisterRequest) -> TokenResponse:
    if get_by_email(db, str(data.email)):
        raise ConflitoError("Este e-mail j\u00e1 est\u00e1 cadastrado.")
    user = Usuario(
        nome=data.name, email=str(data.email), login=str(data.email),
        senha_hash=hash_password(data.password.get_secret_value()), ativo=True,
    )
    try:
        db.add(user)
        db.flush()
        return _new_session(db, user)
    except IntegrityError as exc:
        db.rollback()
        # A concurrent registration can pass the lookup before the unique check.
        if getattr(exc.orig, "pgcode", None) == "23505":
            raise ConflitoError("Este e-mail ou login j\u00e1 est\u00e1 cadastrado.") from exc
        raise


def login(db: Session, data: LoginRequest) -> TokenResponse:
    user = get_by_email(db, str(data.email))
    valid = verify_password(
        data.password.get_secret_value(), user.senha_hash if user else DUMMY_HASH,
    )
    if not valid or user is None or not user.ativo:
        raise NaoAutenticadoError("E-mail ou senha inv\u00e1lidos.")
    return _new_session(db, user)


def authenticate(db: Session, token: str) -> AuthContext:
    try:
        claims = decode_access_token(token)
        user_id = int(claims["sub"])
        session_id = claims["jti"]
        if user_id <= 0 or not isinstance(session_id, str):
            raise ValueError("Invalid claims")
    except (InvalidTokenError, ValueError, TypeError, KeyError) as exc:
        raise NaoAutenticadoError("Sess\u00e3o inv\u00e1lida ou expirada.") from exc
    result = db.execute(
        select(Usuario, SessaoAuth)
        .join(SessaoAuth, SessaoAuth.id_usuario == Usuario.id_usuario)
        .where(
            Usuario.id_usuario == user_id, Usuario.ativo.is_(True),
            SessaoAuth.id_sessao == session_id, SessaoAuth.revogado_em.is_(None),
            SessaoAuth.expira_em > datetime.now(timezone.utc),
        )
    ).first()
    if result is None:
        raise NaoAutenticadoError("Sess\u00e3o inv\u00e1lida ou expirada.")
    return AuthContext(user=result[0], session=result[1])


def logout(db: Session, auth: AuthContext) -> None:
    auth.session.revogado_em = datetime.now(timezone.utc)
    db.commit()
