from pydantic import BaseModel, ConfigDict
from typing import Optional


class MembroGrupoBase(BaseModel):
    id_grupo: int
    id_usuario: int
    status: Optional[str] = "ativo"


class MembroGrupoCreate(MembroGrupoBase):
    pass


class MembroGrupoUpdate(BaseModel):
    status: Optional[str] = None


class MembroGrupoResponse(MembroGrupoBase):
    model_config = ConfigDict(from_attributes=True)
