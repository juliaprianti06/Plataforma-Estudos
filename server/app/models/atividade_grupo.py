from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class AtividadeGrupo(Base):
    __tablename__ = 'atividades_grupo'
    __table_args__ = (Index('ix_atividades_grupo_feed', 'id_grupo', 'id'),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_grupo = Column(Integer, ForeignKey('grupos.id_grupo', ondelete='CASCADE'), nullable=False)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='SET NULL'), nullable=True)
    tipo = Column(String(20), nullable=False)
    texto = Column(Text, nullable=True)
    id_material = Column(Integer, ForeignKey('materiais.id_material', ondelete='SET NULL'), nullable=True)
    titulo_material = Column(String(150), nullable=True)
    tamanho_material = Column(Integer, nullable=True)
    criado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
