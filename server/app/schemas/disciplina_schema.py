from pydantic import BaseModel, Field
from typing import Optional


class DisciplinaBase(BaseModel):
    nome: str = Field(..., min_length=1, description="O nome da disciplina é obrigatório")
    professor: Optional[str] = None
    descricao: Optional[str] = None
    cor: str = Field(default="bg-accent")
    ativo: bool = Field(default=True)

class DisciplinaCreate(DisciplinaBase):
    pass

class DisciplinaResponse(DisciplinaBase):
    id: int
    usuario_id: int

    class Config:
        from_attributes = True