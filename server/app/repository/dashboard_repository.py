from sqlalchemy import exists, or_, select
from sqlalchemy.orm import Session

from app.models.coluna_kanban import ColunaKanban
from app.models.membro_grupo import MembroGrupo
from app.models.tarefa import Tarefa
from app.models.tarefa_responsavel import TarefaResponsavel
from app.models.grupo import Grupo


class DashboardRepository:
    def __init__(self, db: Session):
        self.db = db

    def visible_tasks(self, user_id: int, group_id: int | None = None):
        membership = exists().where(
            MembroGrupo.id_grupo == ColunaKanban.id_grupo,
            MembroGrupo.id_usuario == user_id,
            MembroGrupo.status.in_(("admin", "ativo")),
        )
        if group_id is None:
            membership = membership.where(Grupo.id_grupo == MembroGrupo.id_grupo, Grupo.arquivado.is_(False))
        query = select(Tarefa).outerjoin(
            ColunaKanban, Tarefa.id_coluna == ColunaKanban.id_coluna,
        ).where(or_(
            (Tarefa.id_coluna.is_(None)) & (Tarefa.usuario_id == user_id),
            membership,
        ))
        if group_id is not None:
            query = query.where(ColunaKanban.id_grupo == group_id)
        return self.db.scalars(query.order_by(Tarefa.id)).all()

    def calendar_tasks(self, user_id: int):
        """Return tasks with a deadline visible in the user's calendar."""
        membership = exists().where(
            MembroGrupo.id_grupo == ColunaKanban.id_grupo,
            MembroGrupo.id_usuario == user_id,
            MembroGrupo.status.in_(("admin", "ativo")),
            Grupo.id_grupo == MembroGrupo.id_grupo,
            Grupo.arquivado.is_(False),
        )
        responsible = exists().where(
            TarefaResponsavel.id_tarefa == Tarefa.id,
            TarefaResponsavel.id_usuario == user_id,
        )
        query = select(Tarefa).outerjoin(
            ColunaKanban, Tarefa.id_coluna == ColunaKanban.id_coluna,
        ).where(
            Tarefa.data_prazo.is_not(None),
            or_(
                (Tarefa.id_coluna.is_(None)) & (Tarefa.usuario_id == user_id),
                (Tarefa.id_coluna.is_not(None)) & membership & responsible,
            ),
        )
        return self.db.scalars(query.order_by(Tarefa.data_prazo, Tarefa.id)).all()

    def responsible(self, task_id: int, user_id: int) -> bool:
        return self.db.get(TarefaResponsavel, (task_id, user_id)) is not None
