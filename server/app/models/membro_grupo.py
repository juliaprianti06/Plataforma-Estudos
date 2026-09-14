from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class MembroGrupo(Base):
    """
    Associa um usuário a um grupo (N:N com atributo extra: status).
    Unifica as tabelas 'pertence' e 'Membro grupo' do diagrama original,
    que representavam a mesma relação.
    """
    __tablename__ = "membros_grupo"

    id_grupo = Column(Integer, ForeignKey("grupos.id_grupo"), primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), primary_key=True)
    status = Column(String(20), nullable=False, default="ativo")  # ativo, pendente, admin...
