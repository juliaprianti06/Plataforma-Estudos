from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.routers.auth_router import CurrentAuth
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
    auth: CurrentAuth,
    db: Session = Depends(get_db),
):
    repository = TarefaRepository(db)
    comando = CriarTarefaCommand(
        repository=repository,
        tarefa_data=tarefa,
        usuario_id=auth.user.id_usuario
    )
    return comando.execute()

@router.get("/disciplina/{disciplina_id}", response_model=List[TarefaResponse])
def listar_tarefas_da_disciplina(
    disciplina_id: int,
    auth: CurrentAuth,
    db: Session = Depends(get_db),
):
    repository = TarefaRepository(db)
    return repository.listar_por_disciplina(disciplina_id=disciplina_id, usuario_id=auth.user.id_usuario)
    

@router.put("/{tarefa_id}", response_model=TarefaResponse)
def atualizar_tarefa(
    tarefa_id: int,
    dados_atualizacao: TarefaUpdate,
    auth: CurrentAuth,
    db: Session = Depends(get_db),
):
    repository = TarefaRepository(db)
    comando = AtualizarTarefaCommand(
        repository=repository,
        tarefa_id=tarefa_id,
        dados_atualizacao=dados_atualizacao,
        usuario_id=auth.user.id_usuario
    )
    return comando.execute()

@router.delete("/{tarefa_id}")
def deletar_tarefa(
    tarefa_id: int,
    auth: CurrentAuth,
    db: Session = Depends(get_db),
):
    repository = TarefaRepository(db)
    comando = DeletarTarefaCommand(
        repository=repository,
        tarefa_id=tarefa_id,
        usuario_id=auth.user.id_usuario
    )
    return comando.execute()