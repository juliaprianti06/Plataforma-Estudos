from datetime import datetime, timezone

from fastapi import HTTPException
from app.commands.base_command import BaseCommand
from app.repository.tarefa_repository import TarefaRepository
from app.schemas.tarefa_schema import TarefaUpdate

class AtualizarTarefaCommand(BaseCommand):
    def __init__(self, repository: TarefaRepository, tarefa_id: int, dados_atualizacao: TarefaUpdate, usuario_id: int):
        self.repository = repository
        self.tarefa_id = tarefa_id
        self.dados_atualizacao = dados_atualizacao
        self.usuario_id = usuario_id

    def execute(self):
        tarefa = self.repository.buscar_por_id(self.tarefa_id, self.usuario_id)
        if not tarefa:
            raise HTTPException(status_code=404, detail="Tarefa não encontrada")
        
        dados_dicionario = self.dados_atualizacao.model_dump(exclude_unset=True)
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
