from uuid import UUID

from fastapi import APIRouter, Response

from app.routers.auth_router import CurrentAuth, Database
from app.schemas.sessao_estudo_schema import SessaoEstudoInput, SessaoEstudoResponse
from app.services.sessao_estudo_service import SessaoEstudoService

router = APIRouter(prefix='/sessoes-estudo', tags=['Sessões de estudo'])


@router.get('/', response_model=list[SessaoEstudoResponse])
def listar_sessoes(auth: CurrentAuth, db: Database, response: Response):
    response.headers['Cache-Control'] = 'no-store'
    return SessaoEstudoService(db).listar(auth.user.id_usuario)


@router.post('/', response_model=SessaoEstudoResponse, status_code=201)
def criar_sessao(dados: SessaoEstudoInput, auth: CurrentAuth, db: Database, response: Response):
    response.headers['Cache-Control'] = 'no-store'
    return SessaoEstudoService(db).criar(auth.user.id_usuario, dados)


@router.put('/{sessao_id}', response_model=SessaoEstudoResponse)
def editar_sessao(sessao_id: UUID, dados: SessaoEstudoInput, auth: CurrentAuth, db: Database, response: Response):
    response.headers['Cache-Control'] = 'no-store'
    return SessaoEstudoService(db).editar(auth.user.id_usuario, str(sessao_id), dados)


@router.delete('/{sessao_id}', status_code=204)
def excluir_sessao(sessao_id: UUID, auth: CurrentAuth, db: Database):
    SessaoEstudoService(db).excluir(auth.user.id_usuario, str(sessao_id))
    return Response(status_code=204, headers={'Cache-Control': 'no-store'})
