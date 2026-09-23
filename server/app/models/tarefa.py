from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True, index=True)
    id_coluna = Column(Integer, ForeignKey("colunas_kanban.id_coluna"), nullable=True)
    nome = Column(String, nullable=False)
    prioridade = Column(String, nullable=False) 
    data_vencimento = Column(Date, nullable=True) 
    status = Column(String, nullable=False, default='a_fazer')
    criado_em = Column(DateTime(timezone=True), nullable=True, server_default=func.now())
    concluido_em = Column(DateTime(timezone=True), nullable=True)
    disciplina_id = Column(Integer, ForeignKey("disciplinas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, nullable=False)
    disciplina = relationship("Disciplina", back_populates="tarefas")
