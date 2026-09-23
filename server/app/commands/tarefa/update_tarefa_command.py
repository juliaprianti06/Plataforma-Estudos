from datetime import datetime, timezone

from fastapi import HTTPException
from app.commands.base_command import BaseCommand
from app.repository.tarefa_repository import TarefaRepository
from app.repository.disciplina_repository import DisciplinaRepository
from app.schemas.tarefa_schema import TarefaUpdate

class AtualizarTarefaCommand(BaseCommand):
    def __init__(self, repository: TarefaRepository, tarefa_id: int, dados_atualizacao: TarefaUpdate, usuario_id: int, disciplina_repository: DisciplinaRepository):
        self.repository = repository
        self.disciplina_repository = disciplina_repository
        self.tarefa_id = tarefa_id
        self.dados_atualizacao = dados_atualizacao
        self.usuario_id = usuario_id

    def execute(self):
        tarefa = self.repository.buscar_por_id(self.tarefa_id, self.usuario_id)
        if not tarefa:
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")
        
        dados_dicionario = self.dados_atualizacao.model_dump(exclude_unset=True)
        if 'disciplina_id' in dados_dicionario:
            disciplina = self.disciplina_repository.buscar_por_id(dados_dicionario['disciplina_id'], self.usuario_id)
            if disciplina is None:
                raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        if 'status' in dados_dicionario and dados_dicionario['status'] != tarefa.status:
            tarefa.concluido_em = (
                datetime.now(timezone.utc)
                if dados_dicionario['status'] == 'concluido'
                else None
            )
        for campo, valor in dados_dicionario.items():
            setattr(tarefa, campo, valor)
            
        self.repository.update(tarefa)
        return tarefa
