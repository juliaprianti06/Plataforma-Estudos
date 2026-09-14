from pydantic import BaseModel, ConfigDict
from typing import Optional


class ColunaKanbanBase(BaseModel):
    id_grupo: int
    nome: str
    ordem: int = 0


class ColunaKanbanCreate(ColunaKanbanBase):
    pass


class ColunaKanbanUpdate(BaseModel):
    nome: Optional[str] = None
    ordem: Optional[int] = None


class ColunaKanbanResponse(ColunaKanbanBase):
    id_coluna: int

    model_config = ConfigDict(from_attributes=True)
