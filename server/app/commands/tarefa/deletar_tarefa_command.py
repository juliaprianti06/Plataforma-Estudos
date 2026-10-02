from fastapi import HTTPException
from app.commands.base_command import BaseCommand
from app.repository.tarefa_repository import TarefaRepository

class DeletarTarefaCommand(BaseCommand):
    def __init__(self, repository: TarefaRepository, tarefa_id: int, usuario_id: int):
        self.repository = repository
        self.tarefa_id = tarefa_id
        self.usuario_id = usuario_id

    def execute(self):
        tarefa = self.repository.buscar_por_id(self.tarefa_id, self.usuario_id) 
        if not tarefa:
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")
        
        self.repository.deletar(tarefa)
        self.repository.commit()
        return {"mensagem": "Tarefa excluída com sucesso"}
