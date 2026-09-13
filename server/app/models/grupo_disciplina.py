from sqlalchemy import Column, Integer, ForeignKey
from core.database import Base


class GrupoDisciplina(Base):
    """Associa um grupo de estudo a uma disciplina."""
    __tablename__ = "grupos_disciplinas"

    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), primary_key=True)
    id_disciplina = Column(Integer, ForeignKey("disciplinas.id_disciplina"), primary_key=True)
