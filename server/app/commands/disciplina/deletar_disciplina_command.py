from fastapi import HTTPException, status
from app.commands.base_command import BaseCommand
from app.repository.disciplina_repository import DisciplinaRepository

class DeletarDisciplinaCommand(BaseCommand):
    def __init__(self, repository: DisciplinaRepository, disciplina_id: int, usuario_id: int):
        self.repository = repository
        self.disciplina_id = disciplina_id
        self.usuario_id = usuario_id

    def execute(self):
        disciplina = self.repository.buscar_por_id(self.disciplina_id, self.usuario_id)
        if not disciplina:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina não encontrada")

        self.repository.deletar(disciplina)
        return {"mensagem": "Disciplina deletada com sucesso"}