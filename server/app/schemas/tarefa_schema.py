from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class TarefaBase(BaseModel):
    id_coluna: int
    id_disciplina: Optional[int] = None
    titulo: str
    descricao: Optional[str] = None
    prioridade: Optional[str] = None
    data_inicio: Optional[datetime] = None
    data_prazo: Optional[datetime] = None


class TarefaCreate(TarefaBase):
    pass


class TarefaUpdate(BaseModel):
    id_coluna: Optional[int] = None
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    prioridade: Optional[str] = None
    status: Optional[str] = None
    data_inicio: Optional[datetime] = None
    data_prazo: Optional[datetime] = None


class TarefaResponse(TarefaBase):
    id_tarefa: int
    status: str
    data_criacao: datetime

    model_config = ConfigDict(from_attributes=True)
