from datetime import datetime, timezone
from sqlalchemy import select
from app.core.exceptions import NaoEncontradoError, SemPermissaoError
from app.models.coluna_kanban import ColunaKanban
from app.models.grupo import Grupo
from app.models.grupo_disciplina import GrupoDisciplina
from app.repository.tarefa_repository import TarefaRepository
from app.schemas.tasks_api_schema import TaskResponse
from app.services.groups_service import require_member
from app.commands.tarefa.criar_tarefa_command import CriarTarefaCommand
from app.commands.tarefa.update_tarefa_command import AtualizarTarefaCommand
from app.commands.tarefa.deletar_tarefa_command import DeletarTarefaCommand

STATUS = {"todo": "pendente", "progress": "em_andamento", "done": "concluida"}
PRIORITY = {"high": "alta", "medium": "media", "low": "baixa"}


def context(db, user_id, task_id, edit=False):
    repo = TarefaRepository(db)
    task = repo.buscar_por_id(task_id, user_id)
    if task is None:
        raise NaoEncontradoError("Tarefa n\u00e3o encontrada.")
    group_id = db.get(ColunaKanban, task.id_coluna).id_grupo
    member = require_member(db, group_id, user_id)
    if edit and member.status != "admin" and not repo.is_responsible(task_id, user_id):
        raise SemPermissaoError("Apenas respons\u00e1veis e administradores podem alterar a tarefa.")
    return repo, task, group_id


def values(db, group_id, data):
    if data.disciplineId is not None and db.get(GrupoDisciplina, (group_id, data.disciplineId)) is None:
        raise NaoEncontradoError("Disciplina n\u00e3o vinculada a este grupo.")
    order = ["todo", "progress", "done"].index(data.status)
    column = db.scalar(select(ColunaKanban).where(ColunaKanban.id_grupo == group_id, ColunaKanban.ordem == order).order_by(ColunaKanban.id_coluna))
    if column is None:
        raise NaoEncontradoError("Coluna do grupo n\u00e3o encontrada.")
    return dict(titulo=data.title, descricao=data.description.strip(), prioridade=PRIORITY[data.priority],
                status=STATUS[data.status], data_prazo=data.dueAt, id_disciplina=data.disciplineId, id_coluna=column.id_coluna)


def response(db, task, user_id):
    group = db.get(Grupo, db.get(ColunaKanban, task.id_coluna).id_grupo)
    member = require_member(db, group.id_grupo, user_id)
    return TaskResponse(id=task.id_tarefa, title=task.titulo, description=task.descricao or "",
        priority=next((key for key, value in PRIORITY.items() if value == task.prioridade), "medium"),
        status=next((key for key, value in STATUS.items() if value == task.status), "todo"),
        dueAt=task.data_prazo, disciplineId=task.id_disciplina, groupId=str(group.id_grupo), groupName=group.nome,
        detail=group.nome, canEdit=member.status == "admin" or TarefaRepository(db).is_responsible(task.id_tarefa, user_id))


def list_tasks(db, user_id, group_id=None):
    if group_id is not None:
        require_member(db, group_id, user_id)
    return [response(db, task, user_id) for task in TarefaRepository(db).listar_por_usuario(user_id, group_id)]


def create(db, user_id, data):
    require_member(db, data.groupId, user_id)
    fields = values(db, data.groupId, data)
    if data.status != "todo":
        fields["data_inicio"] = datetime.now(timezone.utc)
    task = CriarTarefaCommand(TarefaRepository(db), fields, user_id).execute()
    return response(db, task, user_id)


def update(db, user_id, task_id, data):
    repo, task, group_id = context(db, user_id, task_id, edit=True)
    fields = values(db, group_id, data)
    if data.status != "todo" and task.data_inicio is None:
        fields["data_inicio"] = datetime.now(timezone.utc)
    return response(db, AtualizarTarefaCommand(repo, task, fields).execute(), user_id)


def remove(db, user_id, task_id):
    repo, task, _ = context(db, user_id, task_id, edit=True)
    DeletarTarefaCommand(repo, task).execute()
