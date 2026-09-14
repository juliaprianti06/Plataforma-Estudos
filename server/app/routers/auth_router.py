from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import NaoAutenticadoError
from app.database import get_db
from app.schemas.auth_schema import AuthUser, LoginRequest, RegisterRequest, TokenResponse
from app.services import auth_service

router = APIRouter()
bearer = HTTPBearer(auto_error=False)
Database = Annotated[Session, Depends(get_db)]


def get_current_auth(
    db: Database,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> auth_service.AuthContext:
    if credentials is None:
        raise NaoAutenticadoError()
    return auth_service.authenticate(db, credentials.credentials)


CurrentAuth = Annotated[auth_service.AuthContext, Depends(get_current_auth)]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Database, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return auth_service.register(db, data)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Database, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return auth_service.login(db, data)


@router.get("/me", response_model=AuthUser)
def me(auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return auth_service.public_user(auth.user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(db: Database, auth: CurrentAuth):
    auth_service.logout(db, auth)
    return Response(status_code=status.HTTP_204_NO_CONTENT, headers={"Cache-Control": "no-store"})
