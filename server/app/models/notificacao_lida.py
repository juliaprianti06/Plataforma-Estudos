from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class NotificacaoLida(Base):
    __tablename__ = 'notificacoes_lidas'
    usuario_id = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), primary_key=True)
    chave = Column(String(100), primary_key=True)
