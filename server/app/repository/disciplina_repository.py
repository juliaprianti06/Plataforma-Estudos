from sqlalchemy.orm import Session
from app.models.disciplinas import Disciplina

class DisciplinaRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_por_usuario(self, usuario_id: int):
        return self.db.query(Disciplina).filter(Disciplina.usuario_id == usuario_id).all()

    def salvar(self, disciplina: Disciplina) -> Disciplina:
        self.db.add(disciplina)
        self.db.flush()
        self.db.refresh(disciplina)
        return disciplina
    

    def buscar_por_id(self, disciplina_id: int, usuario_id: int):
        return self.db.query(Disciplina).filter(
            Disciplina.id == disciplina_id,
            Disciplina.usuario_id == usuario_id
        ).first()

   
    def deletar(self, disciplina: Disciplina):
        self.db.delete(disciplina)
        self.db.flush()
        

    def update(self, disciplina: Disciplina):
        self.db.flush()
        self.db.refresh(disciplina)
        return disciplina

    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def rollback(self) -> None:
        self.db.rollback()
