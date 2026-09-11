from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.routers.disciplina_router import get_current_user 
from app.schemas.tarefa_schema import TarefaCreate, TarefaResponse
from app.repository.tarefa_repository import TarefaRepository
from app.commands.tarefa.criar_tarefa_command import CriarTarefaCommand
from app.schemas.tarefa_schema import TarefaUpdate
from app.commands.tarefa.update_tarefa_command import AtualizarTarefaCommand
from app.commands.tarefa.deletar_tarefa_command import DeletarTarefaCommand

router = APIRouter(
    prefix="/tarefas",
    tags=["Tarefas"]
)

@router.post("/", response_model=TarefaResponse)
def criar_tarefa(
    tarefa: TarefaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repository = TarefaRepository(db)
    comando = CriarTarefaCommand(
        repository=repository,
        dados_tarefa=tarefa,
        usuario_id=current_user.id
    )
    return comando.execute()

@router.get("/disciplina/{disciplina_id}", response_model=List[TarefaResponse])
def listar_tarefas_da_disciplina(
    disciplina_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repository = TarefaRepository(db)
    return repository.listar_por_disciplina(disciplina_id=disciplina_id, usuario_id=current_user.id)
    

@router.put("/{tarefa_id}", response_model=TarefaResponse)
def atualizar_tarefa(
    tarefa_id: int,
    dados_atualizacao: TarefaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repository = TarefaRepository(db)
    comando = AtualizarTarefaCommand(
        repository=repository,
        tarefa_id=tarefa_id,
        dados_atualizacao=dados_atualizacao,
        usuario_id=current_user.id
    )
    return comando.execute()

@router.delete("/{tarefa_id}")
def deletar_tarefa(
    tarefa_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repository = TarefaRepository(db)
    comando = DeletarTarefaCommand(
        repository=repository,
        tarefa_id=tarefa_id,
        usuario_id=current_user.id
    )
    return comando.execute()