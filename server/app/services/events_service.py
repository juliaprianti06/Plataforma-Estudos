from datetime import datetime, timezone
from sqlalchemy import select
from app.core.exceptions import NaoEncontradoError, RegraNegocioError
from app.models.evento_grupo import EventoGrupo
from app.models.grupo import Grupo
from app.models.membro_grupo import MembroGrupo
from app.schemas.tasks_api_schema import EventResponse
from app.services.groups_service import require_member, ACTIVE


def response(db, event, user_id):
    if event.id_grupo is None:
        return EventResponse(id=str(event.id_evento), title=event.titulo, startsAt=event.inicio_em,
            groupId="personal", groupName="Eventos pessoais", canEdit=event.id_criador == user_id)
    member = require_member(db, event.id_grupo, user_id)
    group = db.get(Grupo, event.id_grupo)
    return EventResponse(id=str(event.id_evento), title=event.titulo, startsAt=event.inicio_em,
        groupId=str(event.id_grupo), groupName=group.nome, canEdit=member.status == "admin" and not group.arquivado)


def list_events(db, user_id, group_id=None):
    if group_id is not None:
        require_member(db, group_id, user_id)
        query = select(EventoGrupo).where(EventoGrupo.id_grupo == group_id, EventoGrupo.inicio_em >= datetime.now(timezone.utc))
        events = db.scalars(query.order_by(EventoGrupo.inicio_em, EventoGrupo.id_evento).limit(100)).all()
    else:
        group_events = db.scalars(select(EventoGrupo).join(MembroGrupo, MembroGrupo.id_grupo == EventoGrupo.id_grupo).join(Grupo, Grupo.id_grupo == EventoGrupo.id_grupo).where(
            MembroGrupo.id_usuario == user_id, MembroGrupo.status.in_(ACTIVE), Grupo.arquivado.is_(False), EventoGrupo.inicio_em >= datetime.now(timezone.utc),
        ).order_by(EventoGrupo.inicio_em, EventoGrupo.id_evento).limit(100)).all()
        personal_events = db.scalars(select(EventoGrupo).where(
            EventoGrupo.id_grupo.is_(None), EventoGrupo.id_criador == user_id, EventoGrupo.inicio_em >= datetime.now(timezone.utc),
        ).order_by(EventoGrupo.inicio_em, EventoGrupo.id_evento).limit(100)).all()
        events = sorted(group_events + personal_events, key=lambda event: (event.inicio_em, event.id_evento))[:100]
    return [response(db, event, user_id) for event in events]


def create(db, user_id, data):
    if data.groupId is not None:
        require_member(db, data.groupId, user_id, admin=True, write=True)
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
    if event.id_grupo is None:
        if event.id_criador != user_id:
            raise NaoEncontradoError("Evento não encontrado.")
    else:
        require_member(db, event.id_grupo, user_id, admin=True, write=True)
    db.delete(event)
    db.commit()


def update(db, user_id, event_id, data):
    event = db.get(EventoGrupo, event_id)
    if event is None:
        raise NaoEncontradoError('Evento não encontrado.')
    if event.id_grupo is None:
        if event.id_criador != user_id:
            raise NaoEncontradoError("Evento não encontrado.")
    else:
        require_member(db, event.id_grupo, user_id, admin=True, write=True)
    if data.startsAt <= datetime.now(timezone.utc):
        raise RegraNegocioError('Escolha uma data futura para o evento.')
    event.titulo, event.inicio_em = data.title, data.startsAt
    db.commit()
    return response(db, event, user_id)
