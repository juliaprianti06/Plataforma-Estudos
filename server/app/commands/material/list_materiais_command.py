from typing import List, Optional
from app.commands.base_command import BaseCommand
from app.repository.material_repository import MaterialRepository
from app.models.material import Material

class ListMateriaisCommand(BaseCommand):
    def __init__(self, repository: MaterialRepository, usuario_id: int, disciplina_id: Optional[int] = None):
        self.repository = repository
        self.usuario_id = usuario_id
        self.disciplina_id = disciplina_id

    def execute(self) -> List[Material]:
        return self.repository.listar_por_usuario(self.usuario_id, self.disciplina_id)
