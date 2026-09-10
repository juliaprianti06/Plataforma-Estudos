from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.disciplina_schema import DisciplinaCreate, DisciplinaResponse
from app.repository.disciplina_repository import DisciplinaRepository
from app.commands.criar_disciplina_command import CriarDisciplinaCommand
from app.core.security import get_current_user 

router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])

@router.post("/", status_code=201)
def criar_disciplina(
    disciplina: DisciplinaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repository = DisciplinaRepository(db)
    comando = CriarDisciplinaCommand(
        repository=repository, 
        disciplina_data=disciplina, 
        usuario_id=current_user.id
    )
    
    return comando.execute()

@router.get("/", response_model=List[DisciplinaResponse])
def listar_disciplinas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repository = DisciplinaRepository(db)
    return repository.listar_por_usuario(usuario_id=current_user.id)