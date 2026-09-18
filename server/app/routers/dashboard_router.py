from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Response
from pydantic import BaseModel
from app.routers.auth_router import CurrentAuth, Database
from app.models.perfil_usuario import PerfilUsuario
from app.schemas.tasks_api_schema import TaskResponse, EventResponse
from app.services.tasks_service import list_tasks
from app.services.events_service import list_events

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


@router.get("", response_model=DashboardResponse)
def dashboard(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    tasks = list_tasks(db, auth.user.id_usuario)
    events = list_events(db, auth.user.id_usuario)
    profile = db.get(PerfilUsuario, auth.user.id_usuario)
    now = datetime.now(timezone.utc)
    notifications = []
    if profile is None or profile.notificar_tarefas:
        for task in tasks:
            if task.status != "done" and task.dueAt and task.dueAt <= now + timedelta(days=1):
                notifications.append(f'{task.title}: ' + ("prazo encerrado." if task.dueAt < now else "prazo nas pr\u00f3ximas 24 horas."))
    if profile is None or profile.notificar_grupos:
        notifications.extend(f'{event.title}: encontro do grupo {event.groupName} nos pr\u00f3ximos dias.' for event in events if event.startsAt <= now + timedelta(days=7))
    completed = sum(task.status == "done" for task in tasks)
    resumable = sorted((task for task in tasks if task.canEdit and task.status != "done"), key=lambda task: (task.status != "progress", task.dueAt or datetime.max.replace(tzinfo=timezone.utc), task.id))
    return DashboardResponse(tasks=tasks, events=events, notifications=notifications[:20], summary=StudySummary(
        total=len(tasks), completed=completed, progress=round(completed / len(tasks) * 100) if tasks else 0,
        activeTask=resumable[0] if resumable else None,
    ))
