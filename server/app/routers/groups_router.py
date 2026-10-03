from fastapi import APIRouter, Response
from app.routers.auth_router import CurrentAuth, Database
from app.schemas.groups_schema import GroupCreate, GroupInput, GroupPreview, GroupResponse, InviteInput
from app.services import groups_service as service
from app.schemas.groups_schema import ArchiveInput, GroupWorkspace, MemberResponse, MemberRoleInput, ResponsibilityInput
from app.services import tasks_service, events_service
from app.models.grupo import Grupo
from app.models.tarefa_responsavel import TarefaResponsavel
from app.schemas.material_schema import MaterialResponse
from sqlalchemy import select
from app.services.material_download_service import file_response
from app.schemas.groups_schema import CommentInput, GroupActivity, GroupFeed
from app.services import group_feed_service
from typing import Annotated
from fastapi import Query

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


@router.delete('/{group_id}', status_code=204)
def delete_group(group_id: int, db: Database, auth: CurrentAuth):
    service.remove_group(db, auth.user.id_usuario, group_id)
    return Response(status_code=204)


@router.get('/{group_id}/feed', response_model=GroupFeed)
def feed(group_id: int, db: Database, auth: CurrentAuth, response: Response,
         before: Annotated[int | None, Query(gt=0)] = None):
    response.headers['Cache-Control'] = 'no-store'
    return group_feed_service.list_feed(db, auth.user.id_usuario, group_id, before)


@router.post('/{group_id}/comments', response_model=GroupActivity, status_code=201)
def add_comment(group_id: int, data: CommentInput, db: Database, auth: CurrentAuth):
    return group_feed_service.comment(db, auth.user.id_usuario, group_id, data.text)


@router.delete('/{group_id}/comments/{activity_id}', status_code=204)
def delete_comment(group_id: int, activity_id: int, db: Database, auth: CurrentAuth):
    group_feed_service.remove_comment(db, auth.user.id_usuario, group_id, activity_id)
    return Response(status_code=204)


@router.get('/{group_id}/workspace', response_model=GroupWorkspace)
def workspace(group_id: int, db: Database, auth: CurrentAuth, response: Response):
    response.headers['Cache-Control'] = 'no-store'
    user_id = auth.user.id_usuario
    member = service.require_member(db, group_id, user_id)
    tasks = tasks_service.list_tasks(db, user_id, group_id)
    responsibilities = {task.id: [] for task in tasks}
    for task_id, person_id in db.execute(select(TarefaResponsavel.id_tarefa, TarefaResponsavel.id_usuario).where(TarefaResponsavel.id_tarefa.in_(responsibilities))):
        responsibilities[task_id].append(person_id)
    return GroupWorkspace(group=service.response(db, db.get(Grupo, group_id), member), members=service.members(db, user_id, group_id), tasks=tasks,
        events=events_service.list_events(db, user_id, group_id), materials=service.materials(db, user_id, group_id), responsibilities=responsibilities)


@router.get('/{group_id}/members', response_model=list[MemberResponse])
def members(group_id: int, db: Database, auth: CurrentAuth):
    return service.members(db, auth.user.id_usuario, group_id)


@router.post('/{group_id}/leave', status_code=204)
def leave(group_id: int, db: Database, auth: CurrentAuth):
    service.leave(db, auth.user.id_usuario, group_id)
    return Response(status_code=204)


@router.put('/{group_id}/members/{member_id}', status_code=204)
def role(group_id: int, member_id: int, data: MemberRoleInput, db: Database, auth: CurrentAuth):
    service.change_member(db, auth.user.id_usuario, group_id, member_id, data.role)
    return Response(status_code=204)


@router.delete('/{group_id}/members/{member_id}', status_code=204)
def remove_member(group_id: int, member_id: int, db: Database, auth: CurrentAuth):
    service.change_member(db, auth.user.id_usuario, group_id, member_id)
    return Response(status_code=204)


@router.put('/{group_id}/archive', response_model=GroupResponse)
def archive(group_id: int, data: ArchiveInput, db: Database, auth: CurrentAuth):
    return service.archive(db, auth.user.id_usuario, group_id, data.archived)


@router.post('/{group_id}/invite', response_model=GroupResponse)
def rotate(group_id: int, db: Database, auth: CurrentAuth):
    return service.rotate_invite(db, auth.user.id_usuario, group_id)


@router.put('/{group_id}/tasks/{task_id}/responsibilities', status_code=204)
def assign(group_id: int, task_id: int, data: ResponsibilityInput, db: Database, auth: CurrentAuth):
    service.assign_responsibilities(db, auth.user.id_usuario, group_id, task_id, data.userIds)
    return Response(status_code=204)


@router.post('/{group_id}/materials/{material_id}', response_model=MaterialResponse)
def share(group_id: int, material_id: int, db: Database, auth: CurrentAuth):
    return service.share_material(db, auth.user.id_usuario, group_id, material_id)


@router.delete('/{group_id}/materials/{material_id}', status_code=204)
def unshare(group_id: int, material_id: int, db: Database, auth: CurrentAuth):
    service.unshare_material(db, auth.user.id_usuario, group_id, material_id)
    return Response(status_code=204)


@router.get('/{group_id}/materials/{material_id}/download')
def download(group_id: int, material_id: int, db: Database, auth: CurrentAuth):
    from app.core.exceptions import NaoEncontradoError
    material = next((item for item in service.materials(db, auth.user.id_usuario, group_id) if item.id_material == material_id), None)
    if material is None:
        raise NaoEncontradoError('Material não encontrado neste grupo.')
    return file_response(material)
