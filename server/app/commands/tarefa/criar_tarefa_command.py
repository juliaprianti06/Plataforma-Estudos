from app.commands.base_command import BaseCommand
from app.models.tarefa import Tarefa


class CriarTarefaCommand(BaseCommand):
    def __init__(self, repository, dados_tarefa, usuario_id):
        self.repository = repository
        self.dados_tarefa = dados_tarefa
        self.usuario_id = usuario_id

    def execute(self):
        return self.repository.salvar(Tarefa(**self.dados_tarefa), self.usuario_id)
