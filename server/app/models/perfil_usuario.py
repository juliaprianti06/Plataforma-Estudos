from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database import Base


class PerfilUsuario(Base):
    __tablename__ = "perfis_usuarios"

    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"), primary_key=True)
    nome_inicial = Column(String(100), nullable=False)
    bio = Column(String(300), nullable=False, default="")
    interesses = Column(JSONB, nullable=False, default=list)
    avatar = Column(Text, nullable=True)
    notificar_tarefas = Column(Boolean, nullable=False, default=True)
    notificar_grupos = Column(Boolean, nullable=False, default=True)
    atualizado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
