from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

# Campos base compartilhados
class UsuarioBase(BaseModel):
    nome: str
    login: str
    email: EmailStr

# Usado no POST (criação) - recebe senha em texto puro (será hasheada no backend)
class UsuarioCreate(UsuarioBase):
    senha: str

# Usado no PUT/PATCH (atualização) - todos campos opcionais
class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    login: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    ativo: Optional[bool] = None

# Usado na resposta da API - NUNCA inclui senha/hash
class UsuarioResponse(UsuarioBase):
    id_usuario: int
    ativo: bool
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)  # permite ler direto do model SQLAlchemy