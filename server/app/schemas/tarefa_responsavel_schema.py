from pydantic import BaseModel, ConfigDict


class TarefaResponsavelBase(BaseModel):
    id_tarefa: int
    id_usuario: int


class TarefaResponsavelCreate(TarefaResponsavelBase):
    pass


class TarefaResponsavelResponse(TarefaResponsavelBase):
    model_config = ConfigDict(from_attributes=True)
