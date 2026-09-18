from app.commands.base_command import BaseCommand


class DeletarTarefaCommand(BaseCommand):
    def __init__(self, repository, tarefa):
        self.repository = repository
        self.tarefa = tarefa

    def execute(self):
        self.repository.deletar(self.tarefa)
