from app.commands.base_command import BaseCommand
from app.repository.tarefa_repository import TarefaRepository
from app.models.tarefa import Tarefa
from app.schemas.tarefa_schema import TarefaCreate

class CriarTarefaCommand(BaseCommand):
    def __init__(self, repository: TarefaRepository, dados_tarefa: TarefaCreate, usuario_id: int):
        self.repository = repository
        self.dados_tarefa = dados_tarefa
        self.usuario_id = usuario_id

    def execute(self):
        nova_tarefa = Tarefa(
            nome=self.dados_tarefa.nome,
            prioridade=self.dados_tarefa.prioridade,
            data_vencimento=self.dados_tarefa.data_vencimento,
            feito=self.dados_tarefa.feito,
            disciplina_id=self.dados_tarefa.disciplina_id,
            usuario_id=self.usuario_id
        )
        
        return self.repository.salvar(nova_tarefa)