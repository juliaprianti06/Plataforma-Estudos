from sqlalchemy import delete, exists, select
from sqlalchemy.orm import Session
from app.models.tarefa import Tarefa
from app.models.tarefa_responsavel import TarefaResponsavel
from app.models.coluna_kanban import ColunaKanban
from app.models.membro_grupo import MembroGrupo
from app.services.groups_service import ACTIVE


class TarefaRepository:
    """Adapted from feature/tarefas to approved group and responsibility models."""
    def __init__(self, db: Session):
        self.db = db

    def _query(self, usuario_id):
        return select(Tarefa).join(ColunaKanban, Tarefa.id_coluna == ColunaKanban.id_coluna).join(
            MembroGrupo, MembroGrupo.id_grupo == ColunaKanban.id_grupo,
        ).where(MembroGrupo.id_usuario == usuario_id, MembroGrupo.status.in_(ACTIVE))

    def listar_por_usuario(self, usuario_id, grupo_id=None):
        query = self._query(usuario_id)
        if grupo_id is not None:
            query = query.where(ColunaKanban.id_grupo == grupo_id)
        return self.db.scalars(query.order_by(Tarefa.id_tarefa.desc())).all()

    def buscar_por_id(self, tarefa_id, usuario_id):
        return self.db.scalar(self._query(usuario_id).where(Tarefa.id_tarefa == tarefa_id))

    def salvar(self, tarefa, usuario_id):
        self.db.add(tarefa)
        self.db.flush()
        self.db.add(TarefaResponsavel(id_tarefa=tarefa.id_tarefa, id_usuario=usuario_id))
        self.db.commit()
        self.db.refresh(tarefa)
        return tarefa

    def update(self, tarefa):
        self.db.commit()
        self.db.refresh(tarefa)
        return tarefa

    def deletar(self, tarefa):
        self.db.execute(delete(TarefaResponsavel).where(TarefaResponsavel.id_tarefa == tarefa.id_tarefa))
        self.db.delete(tarefa)
        self.db.commit()

    def is_responsible(self, tarefa_id, usuario_id):
        return self.db.scalar(select(exists().where(TarefaResponsavel.id_tarefa == tarefa_id, TarefaResponsavel.id_usuario == usuario_id)))
