from fastapi import HTTPException
from app.commands.base_command import BaseCommand
from app.repository.material_repository import MaterialRepository
from app.services.storage_service import StorageService

class DeletarMaterialCommand(BaseCommand):
    def __init__(self, repository: MaterialRepository, material_id: int, usuario_id: int):
        self.repository = repository
        self.material_id = material_id
        self.usuario_id = usuario_id

    def execute(self) -> None:
        material = self.repository.buscar_por_id(self.material_id, self.usuario_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material não encontrado.")
        url_arquivo = material.url_arquivo
        self.repository.deletar(material)
        self.repository.commit()
        StorageService.delete_file(url_arquivo)
        return {"mensagem": "Material deletado com sucesso"}
