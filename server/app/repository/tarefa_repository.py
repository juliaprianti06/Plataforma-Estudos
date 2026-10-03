from sqlalchemy.orm import Session
from sqlalchemy import delete
from app.models.tarefa import Tarefa
from app.models.tarefa_responsavel import TarefaResponsavel

class TarefaRepository:
    def __init__(self, db: Session):
        self.db = db

    def salvar(self, tarefa: Tarefa):
        self.db.add(tarefa)
        self.db.flush()
        self.db.refresh(tarefa)
        return tarefa

    def listar_por_disciplina(self, disciplina_id: int, usuario_id: int):
        return self.db.query(Tarefa).filter(
            Tarefa.disciplina_id == disciplina_id,
            Tarefa.id_coluna.is_(None),
            Tarefa.usuario_id == usuario_id
        ).all()
   
   
    def buscar_por_id(self, tarefa_id: int, usuario_id: int):
        return self.db.query(Tarefa).filter(
            Tarefa.id == tarefa_id,
            Tarefa.id_coluna.is_(None),
            Tarefa.usuario_id == usuario_id
        ).first()

    def update(self, tarefa: Tarefa):
        self.db.flush()
        self.db.refresh(tarefa)
        return tarefa

    def deletar(self, tarefa: Tarefa):
        self.db.execute(delete(TarefaResponsavel).where(TarefaResponsavel.id_tarefa == tarefa.id))
        self.db.delete(tarefa)
        self.db.flush()

    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def rollback(self) -> None:
        self.db.rollback()
