from datetime import datetime, timezone

from app.models.tarefa import Tarefa
from app.schemas.tarefa_schema import TarefaCreate
from app.commands.base_command import BaseCommand
from app.repository.tarefa_repository import TarefaRepository

class CriarTarefaCommand(BaseCommand):
    def __init__(self, repository: TarefaRepository, tarefa_data: TarefaCreate, usuario_id: int):
        self.repository = repository
        self.tarefa_data = tarefa_data
        self.usuario_id = usuario_id

    def execute(self) -> Tarefa:
        agora = datetime.now(timezone.utc)
        nova_tarefa = Tarefa(
            id_coluna=self.tarefa_data.id_coluna,
            nome=self.tarefa_data.nome,
            prioridade=self.tarefa_data.prioridade,
            data_vencimento=self.tarefa_data.data_vencimento,
            status=self.tarefa_data.status,
            criado_em=agora,
            concluido_em=agora if self.tarefa_data.status == 'concluido' else None,
            disciplina_id=self.tarefa_data.disciplina_id,
            usuario_id=self.usuario_id
        )
        
        tarefa_criada = self.repository.salvar(nova_tarefa) 
        return tarefa_criada
