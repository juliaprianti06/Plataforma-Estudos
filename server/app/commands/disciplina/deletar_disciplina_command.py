from fastapi import HTTPException, status
from app.commands.base_command import BaseCommand
from app.repository.disciplina_repository import DisciplinaRepository

from app.repository.material_repository import MaterialRepository
from app.services.storage_service import StorageService

class DeletarDisciplinaCommand(BaseCommand):
    def __init__(self, repository: DisciplinaRepository, material_repository: MaterialRepository, disciplina_id: int, usuario_id: int):
        self.repository = repository
        self.material_repository = material_repository
        self.disciplina_id = disciplina_id
        self.usuario_id = usuario_id

    def execute(self):
        disciplina = self.repository.buscar_por_id(self.disciplina_id, self.usuario_id)
        if not disciplina:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina não encontrada")

        materiais = self.material_repository.listar_por_usuario(self.usuario_id, self.disciplina_id)
        self.repository.deletar(disciplina)
        self.repository.commit()
        for material in materiais:
            StorageService.delete_file(material.url_arquivo)
        return {"mensagem": "Disciplina deletada com sucesso"}
