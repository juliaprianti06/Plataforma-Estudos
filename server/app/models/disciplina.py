from sqlalchemy import Column, Integer, String, Text
from core.database import Base


class Disciplina(Base):
    __tablename__ = "disciplinas"

    id_disciplina = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
