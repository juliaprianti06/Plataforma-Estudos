from pydantic import BaseModel, ConfigDict
from typing import Optional


class DisciplinaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None


class DisciplinaCreate(DisciplinaBase):
    pass


class DisciplinaUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class DisciplinaResponse(DisciplinaBase):
    id_disciplina: int

    model_config = ConfigDict(from_attributes=True)
