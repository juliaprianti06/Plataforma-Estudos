from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class TarefaBase(BaseModel):
    id_coluna: Optional[int] = None
    nome: str
    prioridade: str
    data_vencimento: Optional[date] = None
    status: str = 'a_fazer'
    disciplina_id: int

class TarefaCreate(TarefaBase):
    pass

class TarefaUpdate(BaseModel):
    id_coluna: Optional[int] = None
    nome: Optional[str] = None
    prioridade: Optional[str] = None
    data_vencimento: Optional[date] = None
    status: Optional[str] = None
    disciplina_id: Optional[int] = None

class TarefaResponse(TarefaBase):
    id: int
    usuario_id: int
    criado_em: Optional[datetime] = None
    concluido_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
