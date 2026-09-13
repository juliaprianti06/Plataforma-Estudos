from sqlalchemy import Column, Integer, ForeignKey
from core.database import Base


class Compartilha(Base):
    """Compartilhamento direto de um material entre usuários."""
    __tablename__ = "compartilhamentos"

    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), primary_key=True)
    id_material = Column(Integer, ForeignKey("materiais.id_material"), primary_key=True)
