from datetime import datetime, timezone
from sqlalchemy import select
from app.core.exceptions import NaoEncontradoError, RegraNegocioError
from app.models.evento_grupo import EventoGrupo
from app.models.grupo import Grupo
from app.models.membro_grupo import MembroGrupo
from app.schemas.tasks_api_schema import EventResponse
from app.services.groups_service import require_member, ACTIVE


def response(db, event, user_id):
    member = require_member(db, event.id_grupo, user_id)
    return EventResponse(id=str(event.id_evento), title=event.titulo, startsAt=event.inicio_em,
        groupId=str(event.id_grupo), groupName=db.get(Grupo, event.id_grupo).nome, canEdit=member.status == "admin")


def list_events(db, user_id):
    events = db.scalars(select(EventoGrupo).join(MembroGrupo, MembroGrupo.id_grupo == EventoGrupo.id_grupo).where(
        MembroGrupo.id_usuario == user_id, MembroGrupo.status.in_(ACTIVE), EventoGrupo.inicio_em >= datetime.now(timezone.utc),
    ).order_by(EventoGrupo.inicio_em, EventoGrupo.id_evento).limit(100))
    return [response(db, event, user_id) for event in events]


def create(db, user_id, data):
    require_member(db, data.groupId, user_id, admin=True)
    if data.startsAt <= datetime.now(timezone.utc):
        raise RegraNegocioError("Escolha uma data futura para o evento.")
    event = EventoGrupo(id_grupo=data.groupId, id_criador=user_id, titulo=data.title, inicio_em=data.startsAt)
    db.add(event)
    db.commit()
    return response(db, event, user_id)


def remove(db, user_id, event_id):
    event = db.get(EventoGrupo, event_id)
    if event is None:
        raise NaoEncontradoError("Evento n\u00e3o encontrado.")
    require_member(db, event.id_grupo, user_id, admin=True)
    db.delete(event)
    db.commit()
