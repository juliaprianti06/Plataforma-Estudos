from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Index, Integer, Text, Time
from sqlalchemy.orm import relationship

from app.database import Base


class SessaoEstudo(Base):
    __tablename__ = 'sessoes_estudo'
    __table_args__ = (
        CheckConstraint('termino > inicio', name='ck_sessoes_estudo_horarios'),
        CheckConstraint('duracao_minutos > 0 AND duracao_minutos < 1440', name='ck_sessoes_estudo_duracao'),
        Index('ix_sessoes_estudo_usuario_data', 'usuario_id', 'data'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id_usuario', ondelete='CASCADE'), nullable=False)
    disciplina_id = Column(Integer, ForeignKey('disciplinas.id', ondelete='CASCADE'), nullable=False)
    data = Column(Date, nullable=False)
    inicio = Column(Time, nullable=False)
    termino = Column(Time, nullable=False)
    duracao_minutos = Column(Integer, nullable=False)
    observacao = Column(Text, nullable=False, default='')

    disciplina = relationship('Disciplina', back_populates='sessoes_estudo')
