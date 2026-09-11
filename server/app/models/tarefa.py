from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    prioridade = Column(String, nullable=False) 
    data_vencimento = Column(Date, nullable=True) 
    feito = Column(Boolean, default=False)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, nullable=False)
    disciplina = relationship("Disciplina", back_populates="tarefas")