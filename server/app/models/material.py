from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Material(Base):
    __tablename__ = "materiais"

    id_material = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)  # quem fez upload
    titulo = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=True)
    url_arquivo = Column(String(255), nullable=False)
    tipo = Column(String(50), nullable=True)  # pdf, video, link...
    data_upload = Column(DateTime(timezone=True), server_default=func.now())
