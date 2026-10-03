from datetime import datetime, timezone

from sqlalchemy import select

from app.commands.base_command import BaseCommand
from app.core.exceptions import NaoEncontradoError
from app.models.coluna_kanban import ColunaKanban
from app.models.tarefa import Tarefa
from app.repository.tarefa_repository import TarefaRepository
from app.services.task_context import get_task_context


STATUS_TAREFA = {"todo": "a_fazer", "progress": "em_andamento", "done": "concluido"}
ORDEM_COLUNAS = {"todo": 0, "progress": 1, "done": 2}


class MoverTarefaKanbanCommand(BaseCommand):
    def __init__(
        self,
        repository: TarefaRepository,
        user_id: int,
        task_id: int,
        status: str,
    ):
        self.repository = repository
        self.user_id = user_id
        self.task_id = task_id
        self.status = status

    def execute(self) -> Tarefa:
        tarefa, group_id = get_task_context(
            self.repository.db, self.user_id, self.task_id, edit=True
        )
        if group_id is not None:
            coluna = self.repository.db.scalar(
                select(ColunaKanban)
                .where(
                    ColunaKanban.id_grupo == group_id,
                    ColunaKanban.ordem == ORDEM_COLUNAS[self.status],
                )
                .order_by(ColunaKanban.id_coluna)
            )
            if coluna is None:
                raise NaoEncontradoError("Coluna do grupo não encontrada.")
            tarefa.id_coluna = coluna.id_coluna

        novo_status = STATUS_TAREFA[self.status]
        if tarefa.status != novo_status:
            tarefa.status = novo_status
            tarefa.concluido_em = (
                datetime.now(timezone.utc) if self.status == "done" else None
            )

        self.repository.commit()
        return tarefa
