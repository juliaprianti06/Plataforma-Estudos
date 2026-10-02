from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class MaterialBase(BaseModel):
    disciplina_id: int
    titulo: str
    descricao: Optional[str] = None
    tipo: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    tipo: Optional[str] = None


class MaterialResponse(MaterialBase):
    id_material: int
    id_usuario: int
    url_arquivo: str
    content_type: str
    tamanho_bytes: int
    data_upload: datetime

    model_config = ConfigDict(from_attributes=True)
