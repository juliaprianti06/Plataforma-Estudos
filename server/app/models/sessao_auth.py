from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class SessaoAuth(Base):
    __tablename__ = "sessoes_auth"

    id_sessao = Column(String(36), primary_key=True)
    id_usuario = Column(
        Integer, ForeignKey("usuarios.id_usuario", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    criado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expira_em = Column(DateTime(timezone=True), nullable=False, index=True)
    revogado_em = Column(DateTime(timezone=True), nullable=True)
