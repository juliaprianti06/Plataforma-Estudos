from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.repository.progresso_repository import ProgressoRepository
from app.routers.auth_router import CurrentAuth
from app.schemas.progresso_schema import DashboardProgressoResponse, PeriodoProgresso
from app.services.progresso_service import obter_progresso


router = APIRouter(prefix='/progresso', tags=['Progresso'])
Database = Annotated[Session, Depends(get_db)]


@router.get('/', response_model=DashboardProgressoResponse)
def consultar_progresso(
    auth: CurrentAuth,
    db: Database,
    response: Response,
    periodo: Annotated[PeriodoProgresso, Query()] = 'semana',
):
    response.headers['Cache-Control'] = 'no-store'
    repository = ProgressoRepository(db)
    return obter_progresso(repository, auth.user.id_usuario, periodo)
