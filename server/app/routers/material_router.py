from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import List, Optional

from app.routers.auth_router import CurrentAuth, Database
from app.schemas.material_schema import MaterialResponse, MaterialUpdate
from app.repository.material_repository import MaterialRepository
from app.repository.disciplina_repository import DisciplinaRepository

from app.commands.material.upload_material_command import UploadMaterialCommand
from app.commands.material.list_materiais_command import ListMateriaisCommand
from app.commands.material.update_material_command import AtualizarMaterialCommand
from app.commands.material.delete_material_command import DeletarMaterialCommand

router = APIRouter(prefix="/materiais", tags=["Materiais"])


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    auth: CurrentAuth,
    db: Database,
    disciplina_id: int = Form(...),
    titulo: str = Form(...),
    descricao: Optional[str] = Form(None),
    tipo: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    material_repo = MaterialRepository(db)
    disciplina_repo = DisciplinaRepository(db)
    
    command = UploadMaterialCommand(
        material_repo=material_repo,
        disciplina_repo=disciplina_repo,
        usuario_id=auth.user.id_usuario,
        disciplina_id=disciplina_id,
        titulo=titulo,
        file=file,
        descricao=descricao,
        tipo=tipo
    )
    return await command.execute()


@router.get("/", response_model=List[MaterialResponse])
def listar_materiais(
    auth: CurrentAuth,
    db: Database,
    disciplina_id: Optional[int] = None
):
    repository = MaterialRepository(db)
    command = ListMateriaisCommand(repository, auth.user.id_usuario, disciplina_id)
    return command.execute()


@router.put("/{id_material}", response_model=MaterialResponse)
def atualizar_material(
    id_material: int,
    material_in: MaterialUpdate,
    auth: CurrentAuth,
    db: Database
):
    repository = MaterialRepository(db)
    command = AtualizarMaterialCommand(repository, id_material, material_in, auth.user.id_usuario)
    return command.execute()


@router.delete("/{id_material}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_material(
    id_material: int,
    auth: CurrentAuth,
    db: Database
):
    repository = MaterialRepository(db)
    command = DeletarMaterialCommand(repository, id_material, auth.user.id_usuario)
    command.execute()
    return None
