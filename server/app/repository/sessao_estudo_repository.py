from sqlalchemy.orm import Session, joinedload

from app.models.disciplinas import Disciplina
from app.models.sessao_estudo import SessaoEstudo


class SessaoEstudoRepository:
    def __init__(self, db: Session):
        self.db = db

    def _do_usuario(self, usuario_id: int):
        return self.db.query(SessaoEstudo).join(Disciplina).options(
            joinedload(SessaoEstudo.disciplina),
        ).filter(SessaoEstudo.usuario_id == usuario_id, Disciplina.usuario_id == usuario_id)

    def listar(self, usuario_id: int):
        return self._do_usuario(usuario_id).order_by(
            SessaoEstudo.data.desc(), SessaoEstudo.inicio.desc(), SessaoEstudo.id,
        ).all()

    def buscar(self, usuario_id: int, sessao_id: str):
        return self._do_usuario(usuario_id).filter(SessaoEstudo.id == sessao_id).first()

    def buscar_disciplina(self, usuario_id: int, disciplina_id: int):
        return self.db.query(Disciplina).filter(
            Disciplina.id == disciplina_id, Disciplina.usuario_id == usuario_id,
        ).first()

    def salvar(self, sessao: SessaoEstudo):
        try:
            self.db.add(sessao)
            self.db.commit()
            self.db.refresh(sessao)
            return sessao
        except Exception:
            self.db.rollback()
            raise

    def excluir(self, sessao: SessaoEstudo):
        try:
            self.db.delete(sessao)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
