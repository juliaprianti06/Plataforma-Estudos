from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator
from typing import Annotated, Optional


NomeDisciplina = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class DisciplinaBase(BaseModel):
    nome: str = Field(..., min_length=1, description="O nome da disciplina é obrigatório")
    professor: Optional[str] = None
    descricao: Optional[str] = None
    cor: str = Field(default="bg-accent")
    ativo: bool = Field(default=True)

class DisciplinaUpdate(BaseModel):
    nome: Optional[NomeDisciplina] = None
    professor: Optional[str] = None
    descricao: Optional[str] = None
    cor: Optional[str] = None
    ativo: Optional[bool] = None

    @model_validator(mode='before')
    @classmethod
    def rejeitar_nulos_obrigatorios(cls, values):
        if isinstance(values, dict):
            for campo in ('nome', 'cor', 'ativo'):
                if campo in values and values[campo] is None:
                    raise ValueError(f'{campo} não pode ser nulo')
        return values

class DisciplinaCreate(DisciplinaBase):
    nome: NomeDisciplina

class DisciplinaResponse(DisciplinaBase):
    id: int
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)
