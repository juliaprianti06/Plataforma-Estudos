from sqlalchemy import Column, Integer, String, Boolean, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Disciplina(Base):
    __tablename__ = "disciplinas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False)
    nome = Column(String, nullable=False)
    professor = Column(String, nullable=True)
    descricao = Column(String, nullable=True)
    cor = Column(String, nullable=False, default="bg-accent")
    ativo = Column(Boolean, default=True)
    tarefas = relationship("Tarefa", back_populates="disciplina", cascade="all, delete-orphan")