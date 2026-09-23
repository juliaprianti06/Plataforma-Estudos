from fastapi import HTTPException, status
from app.commands.base_command import BaseCommand
from app.repository.disciplina_repository import DisciplinaRepository
from app.schemas.disciplina_schema import DisciplinaUpdate

class AtualizarDisciplinaCommand(BaseCommand):
    def __init__(self, repository: DisciplinaRepository, disciplina_id: int, dados_atualizacao: DisciplinaUpdate, usuario_id: int):
        self.repository = repository
        self.disciplina_id = disciplina_id
        self.dados_atualizacao = dados_atualizacao
        self.usuario_id = usuario_id

    def execute(self):
        disciplina = self.repository.buscar_por_id(self.disciplina_id, self.usuario_id)
        if not disciplina:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disciplina não encontrada")

        dados_dicionario = self.dados_atualizacao.model_dump(exclude_unset=True)
        for chave, valor in dados_dicionario.items():
            setattr(disciplina, chave, valor)

        self.repository.update(disciplina)
        return disciplina
