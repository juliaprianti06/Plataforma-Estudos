from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.material import Material
from app.models.disciplinas import Disciplina

class MaterialRepository:
    def __init__(self, db: Session):
        self.db = db

    def salvar(self, material: Material) -> Material:
        self.db.add(material)
        self.db.flush()
        self.db.refresh(material)
        return material

    def buscar_por_id(self, material_id: int, usuario_id: int) -> Optional[Material]:
        return self.db.query(Material).join(
            Disciplina, Disciplina.id == Material.disciplina_id,
        ).filter(
            Material.id_material == material_id,
            Material.id_usuario == usuario_id,
            Disciplina.usuario_id == usuario_id,
        ).first()

    def listar_por_usuario(self, usuario_id: int, disciplina_id: Optional[int] = None) -> List[Material]:
        query = self.db.query(Material).join(
            Disciplina, Disciplina.id == Material.disciplina_id,
        ).filter(
            Material.id_usuario == usuario_id,
            Disciplina.usuario_id == usuario_id,
        )
        if disciplina_id is not None:
            query = query.filter(Material.disciplina_id == disciplina_id)
        return query.order_by(Material.data_upload.desc()).all()

    def update(self, material: Material) -> Material:
        self.db.add(material)
        self.db.flush()
        self.db.refresh(material)
        return material

    def deletar(self, material: Material) -> None:
        self.db.delete(material)
        self.db.flush()

    def commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def rollback(self) -> None:
        self.db.rollback()
