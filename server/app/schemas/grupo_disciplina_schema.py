from pydantic import BaseModel, ConfigDict


class GrupoDisciplinaBase(BaseModel):
    id_grupo: int
    id_disciplina: int


class GrupoDisciplinaCreate(GrupoDisciplinaBase):
    pass


class GrupoDisciplinaResponse(GrupoDisciplinaBase):
    model_config = ConfigDict(from_attributes=True)
