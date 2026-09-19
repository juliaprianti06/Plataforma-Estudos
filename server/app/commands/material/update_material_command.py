from fastapi import HTTPException
from app.commands.base_command import BaseCommand
from app.repository.material_repository import MaterialRepository
from app.schemas.material_schema import MaterialUpdate
from app.models.material import Material

class AtualizarMaterialCommand(BaseCommand):
    def __init__(self, repository: MaterialRepository, material_id: int, dados_atualizacao: MaterialUpdate, usuario_id: int):
        self.repository = repository
        self.material_id = material_id
        self.dados_atualizacao = dados_atualizacao
        self.usuario_id = usuario_id

    def execute(self) -> Material:
        material = self.repository.buscar_por_id(self.material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material não encontrado.")

        if material.id_usuario != self.usuario_id:
            raise HTTPException(status_code=403, detail="Você não tem permissão para atualizar este material.")

        dados_dicionario = self.dados_atualizacao.model_dump(exclude_unset=True)
        for campo, valor in dados_dicionario.items():
            setattr(material, campo, valor)

        self.repository.update(material)
        return material
