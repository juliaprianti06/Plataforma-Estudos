from sqlalchemy.orm import Session
from app.models.disciplinas import Disciplina

class DisciplinaRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_por_usuario(self, usuario_id: int):
        return self.db.query(Disciplina).filter(Disciplina.usuario_id == usuario_id).all()

    def salvar(self, disciplina: Disciplina) -> Disciplina:
        self.db.add(disciplina)
        self.db.commit()
        self.db.refresh(disciplina)
        return disciplina