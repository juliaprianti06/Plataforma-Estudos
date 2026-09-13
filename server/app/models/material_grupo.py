from sqlalchemy import Column, Integer, ForeignKey
from core.database import Base


class MaterialGrupo(Base):
    """Compartilhamento de um material com outros grupos além do grupo de origem (era 'pertence1')."""
    __tablename__ = "materiais_grupos"

    id_material = Column(Integer, ForeignKey("materiais.id_material"), primary_key=True)
    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), primary_key=True)
