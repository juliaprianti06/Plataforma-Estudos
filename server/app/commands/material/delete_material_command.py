import logging

from fastapi import HTTPException
from app.commands.base_command import BaseCommand
from app.repository.material_repository import MaterialRepository
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

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
        staged_file = StorageService.stage_delete_file(url_arquivo)
        try:
            self.repository.deletar(material)
            self.repository.commit()
        except Exception:
            try:
                StorageService.restore_staged_file(url_arquivo, staged_file)
            except OSError:
                logger.exception("Falha ao restaurar arquivo de material após erro na transação: %s", staged_file)
            raise
        try:
            StorageService.finalize_staged_delete(staged_file)
        except OSError:
            # The material is gone from the database and uploads directory. Keep
            # the staged file quarantined and report it for operational cleanup.
            logger.exception("Material excluído do banco, mas falhou a limpeza do arquivo temporário: %s", staged_file)
        return {"mensagem": "Material deletado com sucesso"}
