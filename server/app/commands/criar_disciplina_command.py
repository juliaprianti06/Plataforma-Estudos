from app.models.disciplinas import Disciplina
from app.schemas.disciplina_schema import DisciplinaCreate
from app.commands.base_command import BaseCommand
from app.repositories.disciplina_repository import DisciplinaRepository

class CriarDisciplinaCommand(BaseCommand):
    def __init__(self, repository: DisciplinaRepository, disciplina_data: DisciplinaCreate, usuario_id: int):
        self.repository = repository
        self.disciplina_data = disciplina_data
        self.usuario_id = usuario_id

    def execute(self) -> Disciplina:
        nova_disciplina = Disciplina(
            nome=self.disciplina_data.nome,
            professor=self.disciplina_data.professor,
            descricao=self.disciplina_data.descricao,
            cor=self.disciplina_data.cor,
            ativo=self.disciplina_data.ativo,
            usuario_id=self.usuario_id
        )
        
        disciplina_criada = self.repository.salvar(nova_disciplina)
        
        return disciplina_criada