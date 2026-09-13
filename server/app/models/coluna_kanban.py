from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class ColunaKanban(Base):
    __tablename__ = "colunas_kanban"

    id_coluna = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), nullable=False)
    nome = Column(String(50), nullable=False)  # "A Fazer", "Em Andamento", "Concluído"...
    ordem = Column(Integer, nullable=False, default=0)
