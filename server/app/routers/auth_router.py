from typing import Annotated
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.exceptions import NaoAutenticadoError, SemPermissaoError, SenhaAtualIncorretaError
from app.core.rate_limit import login_rate_limiter
from app.database import get_db
from app.schemas.auth_schema import AuthUser, ChangePasswordRequest, LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service

router = APIRouter()
bearer = HTTPBearer(auto_error=False)
Database = Annotated[Session, Depends(get_db)]
SESSION_COOKIE = "mindspace_session"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def _request_origin(request: Request) -> str | None:
    origin = request.headers.get("origin")
    if origin:
        return origin
    referer = urlsplit(request.headers.get("referer", ""))
    return f"{referer.scheme}://{referer.netloc}" if referer.scheme and referer.netloc else None


def get_current_auth(
    request: Request,
    db: Database,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> auth_service.AuthContext:
    if credentials is not None:
        return auth_service.authenticate(db, credentials.credentials)
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise NaoAutenticadoError()
    if request.method not in SAFE_METHODS and _request_origin(request) not in get_settings().cors_origins:
        raise SemPermissaoError("Origem da requisição não permitida.")
    return auth_service.authenticate(db, token)


def _set_session_cookie(response: Response, session: TokenResponse, remember: bool) -> None:
    response.set_cookie(
        SESSION_COOKIE, session.access_token,
        max_age=session.expires_in if remember else None,
        httponly=True, secure=get_settings().cookie_secure, samesite="lax", path="/",
    )


CurrentAuth = Annotated[auth_service.AuthContext, Depends(get_current_auth)]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Database, response: Response):
    response.headers["Cache-Control"] = "no-store"
    session = auth_service.register(db, data)
    _set_session_cookie(response, session, data.remember)
    return session


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Database, request: Request, response: Response):
    response.headers["Cache-Control"] = "no-store"
    ip = request.client.host if request.client else "unknown"
    email = str(data.email)
    login_rate_limiter.check(ip=ip, email=email)
    try:
        session = auth_service.login(db, data)
    except NaoAutenticadoError:
        login_rate_limiter.record_failure(ip=ip, email=email)
        raise
    login_rate_limiter.record_success(email=email)
    _set_session_cookie(response, session, data.remember)
    return session


@router.get("/me", response_model=AuthUser)
def me(auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return auth_service.public_user(auth.user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(db: Database, auth: CurrentAuth):
    auth_service.logout(db, auth)
    response = Response(status_code=status.HTTP_204_NO_CONTENT, headers={"Cache-Control": "no-store"})
    response.delete_cookie(SESSION_COOKIE, path="/", secure=get_settings().cookie_secure, httponly=True, samesite="lax")
    return response


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(data: ChangePasswordRequest, db: Database, auth: CurrentAuth, request: Request):
    ip = request.client.host if request.client else "unknown"
    email = auth.user.email
    login_rate_limiter.check(ip=ip, email=email)
    try:
        auth_service.change_password(db, auth, data)
    except SenhaAtualIncorretaError:
        login_rate_limiter.record_failure(ip=ip, email=email)
        raise
    login_rate_limiter.record_success(email=email)
    return Response(status_code=status.HTTP_204_NO_CONTENT, headers={"Cache-Control": "no-store"})
