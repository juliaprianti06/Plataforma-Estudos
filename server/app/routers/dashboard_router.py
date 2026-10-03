from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Response
from pydantic import BaseModel
from app.routers.auth_router import CurrentAuth, Database
from app.models.perfil_usuario import PerfilUsuario
from app.schemas.tasks_api_schema import TaskResponse, EventResponse
from app.services.tasks_service import list_tasks
from app.services.events_service import list_events
from app.models.notificacao_lida import NotificacaoLida
from app.core.exceptions import NaoEncontradoError
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from hashlib import sha256

router = APIRouter()


class StudySummary(BaseModel):
    total: int
    completed: int
    progress: int
    activeTask: TaskResponse | None


class DashboardResponse(BaseModel):
    tasks: list[TaskResponse]
    events: list[EventResponse]
    notifications: list[str]
    summary: StudySummary
    notificationItems: list['Notification'] = []


class Notification(BaseModel):
    id: str
    message: str
    read: bool
    groupId: str
    taskId: int | None = None
    eventId: str | None = None


@router.get("", response_model=DashboardResponse)
def dashboard(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    tasks = list_tasks(db, auth.user.id_usuario)
    events = list_events(db, auth.user.id_usuario)
    profile = db.get(PerfilUsuario, auth.user.id_usuario)
    now = datetime.now(timezone.utc)
    notifications = []
    items = []
    read_keys = set(db.scalars(select(NotificacaoLida.chave).where(NotificacaoLida.usuario_id == auth.user.id_usuario)))
    def append(message, group_id, key, task_id=None, event_id=None):
        notification_id = sha256(key.encode()).hexdigest()
        notifications.append(message)
        items.append(Notification(id=notification_id, message=message, read=notification_id in read_keys, groupId=group_id, taskId=task_id, eventId=event_id))
    if profile is None or profile.notificar_tarefas:
        for task in tasks:
            if task.status != "done" and task.dueAt and task.dueAt <= now + timedelta(days=1):
                append(f'{task.title}: ' + ("prazo encerrado." if task.dueAt < now else "prazo nas próximas 24 horas."), task.groupId, f'task:{task.id}:{task.dueAt.isoformat()}', task_id=task.id)
    if profile is None or profile.notificar_grupos:
        for event in events:
            if event.startsAt <= now + timedelta(days=7):
                append(f'{event.title}: encontro do grupo {event.groupName} nos próximos dias.', event.groupId, f'event:{event.id}:{event.startsAt.isoformat()}', event_id=event.id)
    completed = sum(task.status == "done" for task in tasks)
    resumable = sorted((task for task in tasks if task.canEdit and task.status != "done"), key=lambda task: (task.status != "progress", task.dueAt or datetime.max.replace(tzinfo=timezone.utc), task.id))
    return DashboardResponse(tasks=tasks, events=events, notifications=notifications[:20], notificationItems=items[:20], summary=StudySummary(
        total=len(tasks), completed=completed, progress=round(completed / len(tasks) * 100) if tasks else 0,
        activeTask=resumable[0] if resumable else None,
    ))


@router.post('/notifications/{notification_id}/read', status_code=204)
def mark_read(notification_id: str, db: Database, auth: CurrentAuth):
    visible = dashboard(db, auth, Response()).notificationItems
    if not any(item.id == notification_id for item in visible):
        raise NaoEncontradoError('Notificação não encontrada para esta conta.')
    db.execute(insert(NotificacaoLida).values(usuario_id=auth.user.id_usuario, chave=notification_id).on_conflict_do_nothing())
    db.commit()
    return Response(status_code=204)
