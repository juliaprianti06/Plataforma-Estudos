from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Resumo(Base):
    __tablename__ = "resumos"

    id_resumo = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_disciplina = Column(Integer, ForeignKey("disciplinas.id_disciplina"), nullable=False)
    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)  # autor
    titulo = Column(String(150), nullable=False)
    conteudo = Column(Text, nullable=False)
    data_criacao = Column(DateTime(timezone=True), server_default=func.now())
    data_atualizacao = Column(DateTime(timezone=True), onupdate=func.now())
