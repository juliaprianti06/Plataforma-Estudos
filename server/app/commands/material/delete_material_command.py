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
        material = self.repository.buscar_por_id(self.material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material não encontrado.")

        if material.id_usuario != self.usuario_id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para deletar este material.")
        StorageService.delete_file(material.url_arquivo)

        self.repository.deletar(material)
        return {"mensagem": "Material deletado com sucesso"}