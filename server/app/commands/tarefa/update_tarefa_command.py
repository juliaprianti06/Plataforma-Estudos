from app.commands.base_command import BaseCommand


class AtualizarTarefaCommand(BaseCommand):
    def __init__(self, repository, tarefa, dados_atualizacao):
        self.repository = repository
        self.tarefa = tarefa
        self.dados_atualizacao = dados_atualizacao

    def execute(self):
        for campo, valor in self.dados_atualizacao.items():
            setattr(self.tarefa, campo, valor)
        return self.repository.update(self.tarefa)
