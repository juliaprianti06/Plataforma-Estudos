from pydantic import BaseModel, ConfigDict


class MaterialGrupoBase(BaseModel):
    id_material: int
    id_grupo: int


class MaterialGrupoCreate(MaterialGrupoBase):
    pass


class MaterialGrupoResponse(MaterialGrupoBase):
    model_config = ConfigDict(from_attributes=True)
