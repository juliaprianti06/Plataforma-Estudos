from datetime import date, datetime

from sqlalchemy import Date, case, cast, func
from sqlalchemy.orm import Session

from app.models.disciplinas import Disciplina
from app.models.tarefa import Tarefa


class ProgressoRepository:
    def __init__(self, db: Session):
        self.db = db

    def indicadores_atuais(self, usuario_id: int, hoje: date) -> dict[str, int]:
        total, concluidas, atrasadas = self.db.query(
            func.count(Tarefa.id),
            func.coalesce(func.sum(case((Tarefa.status == 'concluido', 1), else_=0)), 0),
            func.coalesce(func.sum(case((
                (Tarefa.status != 'concluido') &
                Tarefa.data_vencimento.is_not(None) &
                (Tarefa.data_vencimento < hoje), 1
            ), else_=0)), 0),
        ).join(
            Disciplina,
            (Disciplina.id == Tarefa.disciplina_id) &
            (Disciplina.usuario_id == usuario_id),
        ).filter(Tarefa.usuario_id == usuario_id).one()

        return {
            'tarefas_total': int(total or 0),
            'tarefas_concluidas_total': int(concluidas or 0),
            'tarefas_atrasadas': int(atrasadas or 0),
        }

    def tarefas_com_prazo_no_periodo(
        self, usuario_id: int, inicio: date, fim_exclusivo: date,
    ) -> dict[str, int]:
        total, concluidas = self.db.query(
            func.count(Tarefa.id),
            func.coalesce(func.sum(case((Tarefa.status == 'concluido', 1), else_=0)), 0),
        ).join(
            Disciplina,
            (Disciplina.id == Tarefa.disciplina_id) &
            (Disciplina.usuario_id == usuario_id),
        ).filter(
            Tarefa.usuario_id == usuario_id,
            Tarefa.data_vencimento >= inicio,
            Tarefa.data_vencimento < fim_exclusivo,
        ).one()

        return {
            'total': int(total or 0),
            'concluidas': int(concluidas or 0),
        }

    def conclusoes_no_periodo(
        self, usuario_id: int, inicio: datetime, fim_exclusivo: datetime,
    ) -> int:
        total = self.db.query(func.count(Tarefa.id)).join(
            Disciplina,
            (Disciplina.id == Tarefa.disciplina_id) &
            (Disciplina.usuario_id == usuario_id),
        ).filter(
            Tarefa.usuario_id == usuario_id,
            Tarefa.status == 'concluido',
            Tarefa.concluido_em >= inicio,
            Tarefa.concluido_em < fim_exclusivo,
        ).scalar()
        return int(total or 0)

    def conclusoes_por_dia(
        self, usuario_id: int, inicio: datetime, fim_exclusivo: datetime,
        fuso: str,
    ) -> dict[date, int]:
        dia_local = cast(func.timezone(fuso, Tarefa.concluido_em), Date)
        resultados = self.db.query(dia_local, func.count(Tarefa.id)).join(
            Disciplina,
            (Disciplina.id == Tarefa.disciplina_id) &
            (Disciplina.usuario_id == usuario_id),
        ).filter(
            Tarefa.usuario_id == usuario_id,
            Tarefa.status == 'concluido',
            Tarefa.concluido_em >= inicio,
            Tarefa.concluido_em < fim_exclusivo,
        ).group_by(dia_local).all()
        return {dia: int(total) for dia, total in resultados}

    def disciplinas_do_usuario(self, usuario_id: int) -> list[dict]:
        concluidas = func.coalesce(func.sum(case((Tarefa.status == 'concluido', 1), else_=0)), 0)
        resultados = self.db.query(
            Disciplina.id,
            Disciplina.nome,
            func.count(Tarefa.id),
            concluidas,
        ).outerjoin(
            Tarefa,
            (Tarefa.disciplina_id == Disciplina.id) &
            (Tarefa.usuario_id == usuario_id),
        ).filter(
            Disciplina.usuario_id == usuario_id,
        ).group_by(Disciplina.id, Disciplina.nome).all()

        return [{
            'disciplina_id': disciplina_id,
            'nome': nome,
            'tarefas_total': int(total or 0),
            'tarefas_concluidas_total': int(concluidas_total or 0),
        } for disciplina_id, nome, total, concluidas_total in resultados]

    def conclusoes_por_disciplina(
        self, usuario_id: int, inicio: datetime, fim_exclusivo: datetime,
    ) -> dict[int, int]:
        resultados = self.db.query(
            Tarefa.disciplina_id,
            func.count(Tarefa.id),
        ).join(
            Disciplina,
            (Disciplina.id == Tarefa.disciplina_id) &
            (Disciplina.usuario_id == usuario_id),
        ).filter(
            Tarefa.usuario_id == usuario_id,
            Tarefa.status == 'concluido',
            Tarefa.concluido_em >= inicio,
            Tarefa.concluido_em < fim_exclusivo,
        ).group_by(Tarefa.disciplina_id).all()
        return {disciplina_id: int(total) for disciplina_id, total in resultados}

    def conclusoes_sem_data(self, usuario_id: int) -> int:
        total = self.db.query(func.count(Tarefa.id)).join(
            Disciplina,
            (Disciplina.id == Tarefa.disciplina_id) &
            (Disciplina.usuario_id == usuario_id),
        ).filter(
            Tarefa.usuario_id == usuario_id,
            Tarefa.status == 'concluido',
            Tarefa.concluido_em.is_(None),
        ).scalar()
        return int(total or 0)
