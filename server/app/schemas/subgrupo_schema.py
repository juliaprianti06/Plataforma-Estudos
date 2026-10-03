from pydantic import BaseModel, ConfigDict


class SubgrupoBase(BaseModel):
    id_grupo_pai: int
    id_grupo_filho: int


class SubgrupoCreate(SubgrupoBase):
    pass


class SubgrupoResponse(SubgrupoBase):
    model_config = ConfigDict(from_attributes=True)
