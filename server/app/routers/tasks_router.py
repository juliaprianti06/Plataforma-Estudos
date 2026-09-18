from fastapi import APIRouter, Query, Response
from app.routers.auth_router import CurrentAuth, Database
from app.schemas.tasks_api_schema import TaskCreate, TaskFields, TaskResponse, EventInput, EventResponse
from app.services import tasks_service, events_service

router = APIRouter()


@router.get("/tasks", response_model=list[TaskResponse])
def list_tasks(db: Database, auth: CurrentAuth, response: Response, groupId: int | None = Query(default=None, gt=0)):
    response.headers["Cache-Control"] = "no-store"
    return tasks_service.list_tasks(db, auth.user.id_usuario, groupId)


@router.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Database, auth: CurrentAuth):
    return tasks_service.create(db, auth.user.id_usuario, data)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskFields, db: Database, auth: CurrentAuth):
    return tasks_service.update(db, auth.user.id_usuario, task_id, data)


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Database, auth: CurrentAuth):
    tasks_service.remove(db, auth.user.id_usuario, task_id)
    return Response(status_code=204)


@router.get("/events", response_model=list[EventResponse])
def list_events(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return events_service.list_events(db, auth.user.id_usuario)


@router.post("/events", response_model=EventResponse, status_code=201)
def create_event(data: EventInput, db: Database, auth: CurrentAuth):
    return events_service.create(db, auth.user.id_usuario, data)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Database, auth: CurrentAuth):
    events_service.remove(db, auth.user.id_usuario, event_id)
    return Response(status_code=204)
