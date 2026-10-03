from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, false
from sqlalchemy.sql import func
from app.database import Base
from app.core.invite_code import new_invite_code


class Grupo(Base):
    __tablename__ = "grupos"

    id_grupo = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())

    categoria = Column(String(30), nullable=False, server_default="Programa\u00e7\u00e3o")
    icone = Column(String(20), nullable=False, server_default="react")
    codigo_convite = Column(String(6), nullable=False, unique=True, default=new_invite_code)
    privado = Column(Boolean, nullable=False, server_default=false(), default=False)
    arquivado = Column(Boolean, nullable=False, server_default=false(), default=False)
    excluido_em = Column(DateTime(timezone=True), nullable=True)
