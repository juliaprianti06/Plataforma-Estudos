from fastapi import UploadFile, HTTPException
from typing import Optional
from app.commands.base_command import BaseCommand
from app.repository.material_repository import MaterialRepository
from app.repository.disciplina_repository import DisciplinaRepository
from app.models.material import Material
from app.services.storage_service import StorageService

class UploadMaterialCommand(BaseCommand):
    def __init__(self, material_repo: MaterialRepository, disciplina_repo: DisciplinaRepository, 
                 usuario_id: int, disciplina_id: int, titulo: str, file: UploadFile, 
                 descricao: Optional[str] = None, tipo: Optional[str] = None):
        self.material_repo = material_repo
        self.disciplina_repo = disciplina_repo
        self.usuario_id = usuario_id
        self.disciplina_id = disciplina_id
        self.titulo = titulo
        self.file = file
        self.descricao = descricao
        self.tipo = tipo

    async def execute(self) -> Material:
        disciplina = self.disciplina_repo.buscar_por_id(self.disciplina_id, self.usuario_id)
        if not disciplina:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada.")

        url_arquivo, content_type, tamanho_bytes = await StorageService.save_file(self.file)

        novo_material = Material(
            disciplina_id=self.disciplina_id,
            id_usuario=self.usuario_id,
            titulo=self.titulo,
            descricao=self.descricao,
            url_arquivo=url_arquivo,
            content_type=content_type,
            tamanho_bytes=tamanho_bytes,
            tipo=self.tipo
        )

        return self.material_repo.salvar(novo_material)
