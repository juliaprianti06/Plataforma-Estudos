from fastapi import APIRouter, Response
from app.routers.auth_router import CurrentAuth, Database
from app.schemas.groups_schema import GroupCreate, GroupInput, GroupPreview, GroupResponse, InviteInput
from app.services import groups_service as service

router = APIRouter()


@router.get("", response_model=list[GroupResponse])
def list_groups(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return service.list_groups(db, auth.user.id_usuario)


@router.get("/discover", response_model=list[GroupPreview])
def discover(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return service.discover(db, auth.user.id_usuario)


@router.post("", response_model=GroupResponse, status_code=201)
def create(data: GroupCreate, db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return service.create(db, auth.user.id_usuario, data)


@router.post("/join", response_model=GroupResponse)
def join_by_code(data: InviteInput, db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return service.join(db, auth.user.id_usuario, code=data.code)


@router.post("/{group_id}/join", response_model=GroupResponse)
def join_by_id(group_id: int, db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return service.join(db, auth.user.id_usuario, group_id=group_id)


@router.put("/{group_id}", response_model=GroupResponse)
def update(group_id: int, data: GroupInput, db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return service.update(db, auth.user.id_usuario, group_id, data)
