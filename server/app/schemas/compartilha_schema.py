from pydantic import BaseModel, ConfigDict


class CompartilhaBase(BaseModel):
    id_usuario: int
    id_material: int


class CompartilhaCreate(CompartilhaBase):
    pass


class CompartilhaResponse(CompartilhaBase):
    model_config = ConfigDict(from_attributes=True)
