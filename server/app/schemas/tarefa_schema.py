from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator
from typing import Annotated, Literal, Optional
from datetime import date, datetime

TextoObrigatorio = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
StatusTarefa = Literal['a_fazer', 'em_andamento', 'concluido']


class TarefaBase(BaseModel):
    id_coluna: Optional[int] = None
    nome: str
    prioridade: str
    data_vencimento: Optional[date] = None
    status: str = 'a_fazer'
    disciplina_id: int

class TarefaCreate(TarefaBase):
    nome: TextoObrigatorio
    prioridade: TextoObrigatorio
    status: StatusTarefa = 'a_fazer'

class TarefaUpdate(BaseModel):
    id_coluna: Optional[int] = None
    nome: Optional[TextoObrigatorio] = None
    prioridade: Optional[TextoObrigatorio] = None
    data_vencimento: Optional[date] = None
    status: Optional[StatusTarefa] = None
    disciplina_id: Optional[int] = None

    @model_validator(mode='before')
    @classmethod
    def rejeitar_nulos_obrigatorios(cls, values):
        if isinstance(values, dict):
            for campo in ('nome', 'prioridade', 'status', 'disciplina_id'):
                if campo in values and values[campo] is None:
                    raise ValueError(f'{campo} não pode ser nulo')
        return values

class TarefaResponse(TarefaBase):
    id: int
    usuario_id: int
    criado_em: Optional[datetime] = None
    concluido_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
