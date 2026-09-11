from sqlalchemy.orm import Session
from app.models.tarefa import Tarefa

class TarefaRepository:
    def __init__(self, db: Session):
        self.db = db

    def salvar(self, tarefa: Tarefa):
        self.db.add(tarefa)
        self.db.commit()
        self.db.refresh(tarefa)
        return tarefa

    def listar_por_disciplina(self, disciplina_id: int, usuario_id: int):
        return self.db.query(Tarefa).filter(
            Tarefa.disciplina_id == disciplina_id,
            Tarefa.usuario_id == usuario_id
        ).all()
   
   
    def buscar_por_id(self, tarefa_id: int, usuario_id: int):
        return self.db.query(Tarefa).filter(
            Tarefa.id == tarefa_id,
            Tarefa.usuario_id == usuario_id
        ).first()

    def update(self, tarefa: Tarefa):
        self.db.commit()
        self.db.refresh(tarefa)
        return tarefa

    def deletar(self, tarefa: Tarefa):
        self.db.delete(tarefa)
        self.db.commit()