from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database import Base


class EventoGrupo(Base):
    __tablename__ = "eventos_grupo"
    id_evento = Column(Integer, primary_key=True)
    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), nullable=False, index=True)
    id_criador = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    titulo = Column(String(150), nullable=False)
    inicio_em = Column(DateTime(timezone=True), nullable=False, index=True)
