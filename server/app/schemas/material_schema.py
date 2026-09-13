from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class MaterialBase(BaseModel):
    id_grupo: int
    titulo: str
    descricao: Optional[str] = None
    url_arquivo: str
    tipo: Optional[str] = None


class MaterialCreate(MaterialBase):
    # id_usuario (quem fez o upload) deve vir do usuário autenticado (token),
    # nunca do corpo da requisição.
    pass


class MaterialUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    tipo: Optional[str] = None


class MaterialResponse(MaterialBase):
    id_material: int
    id_usuario: int
    data_upload: datetime

    model_config = ConfigDict(from_attributes=True)
