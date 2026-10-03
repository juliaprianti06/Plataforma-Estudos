from datetime import datetime, timezone
from uuid import uuid4

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from app.config import get_settings

password_hash = PasswordHash.recommended()
# Equalize password verification work when the account does not exist.
DUMMY_HASH = password_hash.hash(uuid4().hex)
ALGORITHM = "HS256"
ISSUER = "mindspace-api"
AUDIENCE = "mindspace-web"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return password_hash.verify(password, stored_hash)
    except (UnknownHashError, ValueError):
        return False


def create_access_token(user_id: int, session_id: str, expires_at: datetime) -> str:
    return jwt.encode(
        {
            "sub": str(user_id), "jti": session_id,
            "iat": datetime.now(timezone.utc), "exp": expires_at,
            "iss": ISSUER, "aud": AUDIENCE,
        },
        get_settings().jwt_secret.get_secret_value(), algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token, get_settings().jwt_secret.get_secret_value(),
        algorithms=[ALGORITHM], issuer=ISSUER, audience=AUDIENCE,
        options={"require": ["sub", "jti", "iat", "exp", "iss", "aud"]},
    )
