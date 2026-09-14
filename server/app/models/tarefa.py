from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Tarefa(Base):
    __tablename__ = "tarefas"

    id_tarefa = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_coluna = Column(Integer, ForeignKey("colunas_kanban.id_coluna"), nullable=False)
    id_disciplina = Column(Integer, ForeignKey("disciplinas.id_disciplina"), nullable=True)
    titulo = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=True)
    prioridade = Column(String(20), nullable=True)  # baixa, media, alta
    status = Column(String(20), nullable=False, default="pendente")
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    data_inicio = Column(DateTime(timezone=True), nullable=True)
    data_prazo = Column(DateTime(timezone=True), nullable=True)
