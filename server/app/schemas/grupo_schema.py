from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class GrupoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None


class GrupoCreate(GrupoBase):
    pass


class GrupoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class GrupoResponse(GrupoBase):
    id_grupo: int
    data_criacao: datetime

    model_config = ConfigDict(from_attributes=True)
