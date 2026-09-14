from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ResumoBase(BaseModel):
    id_disciplina: int
    id_grupo: int
    titulo: str
    conteudo: str


class ResumoCreate(ResumoBase):
    # id_usuario (autor) deve vir do usuário autenticado, não do corpo da requisição.
    pass


class ResumoUpdate(BaseModel):
    titulo: Optional[str] = None
    conteudo: Optional[str] = None


class ResumoResponse(ResumoBase):
    id_resumo: int
    id_usuario: int
    data_criacao: datetime
    data_atualizacao: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
