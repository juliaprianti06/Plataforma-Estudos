from datetime import datetime, time, timezone

from sqlalchemy import select

from app.core.exceptions import NaoEncontradoError, SemPermissaoError
from app.models.coluna_kanban import ColunaKanban
from app.models.disciplinas import Disciplina
from app.models.grupo import Grupo
from app.models.tarefa import Tarefa
from app.models.tarefa_responsavel import TarefaResponsavel
from app.repository.dashboard_repository import DashboardRepository
from app.repository.tarefa_repository import TarefaRepository
from app.schemas.tasks_api_schema import TaskResponse
from app.services.groups_service import require_member

STATUS = {"todo": "a_fazer", "progress": "em_andamento", "done": "concluido"}
PRIORITY = {"high": "alta", "medium": "media", "low": "baixa"}


def context(db, user_id, task_id, edit=False):
    task = db.get(Tarefa, task_id)
    if task is None:
        raise NaoEncontradoError("Tarefa não encontrada.")
    if task.id_coluna is None:
        if task.usuario_id != user_id:
            raise NaoEncontradoError("Tarefa não encontrada.")
        return task, None
    column = db.get(ColunaKanban, task.id_coluna)
    member = require_member(db, column.id_grupo, user_id)
    if edit and member.status != "admin" and not DashboardRepository(db).responsible(task_id, user_id):
        raise SemPermissaoError("Apenas responsáveis e administradores podem alterar a tarefa.")
    return task, column.id_grupo


def fields(db, user_id, group_id, data):
    if data.disciplineId is not None:
        discipline = db.get(Disciplina, data.disciplineId)
        if discipline is None or discipline.usuario_id != user_id:
            raise NaoEncontradoError("Disciplina não encontrada para esta conta.")
    elif group_id is None:
        raise NaoEncontradoError("Uma tarefa pessoal precisa de uma disciplina.")
    column_id = None
    if group_id is not None:
        column = db.scalar(select(ColunaKanban).where(
            ColunaKanban.id_grupo == group_id,
            ColunaKanban.ordem == ["todo", "progress", "done"].index(data.status),
        ).order_by(ColunaKanban.id_coluna))
        if column is None:
            raise NaoEncontradoError("Coluna do grupo não encontrada.")
        column_id = column.id_coluna
    return dict(
        nome=data.title, descricao=data.description.strip(), prioridade=PRIORITY[data.priority],
        status=STATUS[data.status], data_prazo=data.dueAt,
        data_vencimento=data.dueAt.date() if data.dueAt else None,
        disciplina_id=data.disciplineId, id_coluna=column_id,
    )


def response(db, task, user_id):
    _, group_id = context(db, user_id, task.id)
    if group_id is None:
        group_name = task.disciplina.nome if task.disciplina else "Estudos pessoais"
        can_edit = True
    else:
        group_name = db.get(Grupo, group_id).nome
        can_edit = (require_member(db, group_id, user_id).status == "admin"
                    or DashboardRepository(db).responsible(task.id, user_id))
    due_at = task.data_prazo
    if due_at is None and task.data_vencimento:
        due_at = datetime.combine(task.data_vencimento, time.max, tzinfo=timezone.utc)
    return TaskResponse(
        id=task.id, title=task.nome, description=task.descricao or "",
        priority=next((k for k, v in PRIORITY.items() if v == task.prioridade), "medium"),
        status=next((k for k, v in STATUS.items() if v == task.status), "todo"),
        dueAt=due_at, disciplineId=task.disciplina_id,
        groupId=str(group_id) if group_id is not None else "personal",
        groupName=group_name, detail=group_name, canEdit=can_edit,
    )


def list_tasks(db, user_id, group_id=None):
    if group_id is not None:
        require_member(db, group_id, user_id)
    return [response(db, task, user_id) for task in DashboardRepository(db).visible_tasks(user_id, group_id)]


def create(db, user_id, data):
    require_member(db, data.groupId, user_id)
    values = fields(db, user_id, data.groupId, data)
    task = Tarefa(**values, usuario_id=user_id)
    if data.status == "done":
        task.concluido_em = datetime.now(timezone.utc)
    repo = TarefaRepository(db)
    try:
        repo.salvar(task)
        db.add(TarefaResponsavel(id_tarefa=task.id, id_usuario=user_id))
        repo.commit()
    except Exception:
        repo.rollback()
        raise
    return response(db, task, user_id)


def update(db, user_id, task_id, data):
    task, group_id = context(db, user_id, task_id, edit=True)
    values = fields(db, task.usuario_id, group_id, data)
    if values["status"] != task.status:
        task.concluido_em = datetime.now(timezone.utc) if data.status == "done" else None
    for field, value in values.items():
        setattr(task, field, value)
    TarefaRepository(db).commit()
    return response(db, task, user_id)


def remove(db, user_id, task_id):
    task, _ = context(db, user_id, task_id, edit=True)
    repo = TarefaRepository(db)
    try:
        repo.deletar(task)
        repo.commit()
    except Exception:
        repo.rollback()
        raise
