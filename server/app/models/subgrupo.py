from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base


class Subgrupo(Base):
    """
    Relação hierárquica entre grupos (grupo pai -> subgrupo).
    Corresponde às tabelas 'tem1'/'pertence2' do diagrama original.
    """
    __tablename__ = "subgrupos"

    id_grupo_pai = Column(Integer, ForeignKey("grupos.id_grupo"), primary_key=True)
    id_grupo_filho = Column(Integer, ForeignKey("grupos.id_grupo"), primary_key=True)
