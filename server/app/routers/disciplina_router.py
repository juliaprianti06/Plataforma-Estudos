from typing import List

from fastapi import APIRouter

from app.routers.auth_router import CurrentAuth, Database
from app.schemas.disciplina_schema import DisciplinaCreate, DisciplinaResponse, DisciplinaUpdate
from app.repository.disciplina_repository import DisciplinaRepository
from app.repository.material_repository import MaterialRepository
from app.commands.disciplina.criar_disciplina_command import CriarDisciplinaCommand
from app.commands.disciplina.update_disciplina_command import AtualizarDisciplinaCommand
from app.commands.disciplina.deletar_disciplina_command import DeletarDisciplinaCommand
router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])

@router.post("/", status_code=201)
def criar_disciplina(
    disciplina: DisciplinaCreate,
    auth: CurrentAuth,
    db: Database,
):
    repository = DisciplinaRepository(db)
    comando = CriarDisciplinaCommand(
        repository=repository,
        disciplina_data=disciplina,
        usuario_id=auth.user.id_usuario
    )
    return comando.execute()

@router.get("/", response_model=List[DisciplinaResponse])
def listar_disciplinas(
    auth: CurrentAuth,
    db: Database,
):
    repository = DisciplinaRepository(db)
    return repository.listar_por_usuario(usuario_id=auth.user.id_usuario)

@router.put("/{disciplina_id}", response_model=DisciplinaResponse)
def atualizar_disciplina(
    disciplina_id: int,
    disciplina: DisciplinaUpdate,
    auth: CurrentAuth,
    db: Database,
):
    repository = DisciplinaRepository(db)
    comando = AtualizarDisciplinaCommand(
        repository=repository,
        disciplina_id=disciplina_id,
        dados_atualizacao=disciplina,
        usuario_id=auth.user.id_usuario
    )
    return comando.execute()

@router.delete("/{disciplina_id}", status_code=204)
def deletar_disciplina(
    disciplina_id: int,
    auth: CurrentAuth,
    db: Database,
):
    repository = DisciplinaRepository(db)
    material_repository = MaterialRepository(db)
    comando = DeletarDisciplinaCommand(
        repository=repository,
        material_repository=material_repository,
        disciplina_id=disciplina_id,
        usuario_id=auth.user.id_usuario
    )
    comando.execute()
    return
