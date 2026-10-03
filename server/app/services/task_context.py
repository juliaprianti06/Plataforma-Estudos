from sqlalchemy.orm import Session

from app.core.exceptions import NaoEncontradoError, SemPermissaoError
from app.models.coluna_kanban import ColunaKanban
from app.models.tarefa import Tarefa
from app.repository.dashboard_repository import DashboardRepository
from app.services.groups_service import require_member


def get_task_context(
    db: Session, user_id: int, task_id: int, edit: bool = False
) -> tuple[Tarefa, int | None]:
    task = db.get(Tarefa, task_id)
    if task is None:
        raise NaoEncontradoError("Tarefa não encontrada.")
    if task.id_coluna is None:
        if task.usuario_id != user_id:
            raise NaoEncontradoError("Tarefa não encontrada.")
        return task, None

    column = db.get(ColunaKanban, task.id_coluna)
    member = require_member(db, column.id_grupo, user_id, write=edit)
    if (
        edit
        and member.status != "admin"
        and not DashboardRepository(db).responsible(task_id, user_id)
    ):
        raise SemPermissaoError("Apenas responsáveis e administradores podem alterar a tarefa.")
    return task, column.id_grupo

