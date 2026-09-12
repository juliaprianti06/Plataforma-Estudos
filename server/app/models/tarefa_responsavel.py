from sqlalchemy import Column, Integer, ForeignKey
from core.database import Base


class TarefaResponsavel(Base):
    """
    Permite atribuir uma ou mais pessoas responsáveis por uma tarefa.
    Unifica 'tem2' e 'Tarefa Responsavel' do diagrama original.
    """
    __tablename__ = "tarefas_responsaveis"

    id_tarefa = Column(Integer, ForeignKey("tarefas.id_tarefa"), primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), primary_key=True)
