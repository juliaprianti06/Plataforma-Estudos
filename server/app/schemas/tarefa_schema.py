from pydantic import BaseModel
from typing import Optional
from datetime import date

class TarefaBase(BaseModel):
    nome: str
    prioridade: str
    data_vencimento: Optional[date] = None
    status: str = 'a_fazer'
    disciplina_id: int

class TarefaCreate(TarefaBase):
    pass

class TarefaUpdate(BaseModel):
    nome: Optional[str] = None
    prioridade: Optional[str] = None
    data_vencimento: Optional[date] = None
    status: Optional[str] = None
    disciplina_id: Optional[int] = None

class TarefaResponse(TarefaBase):
    id: int
    usuario_id: int

    class Config:
        from_attributes = True