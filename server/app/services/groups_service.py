from sqlalchemy import exists, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflitoError, NaoEncontradoError, SemPermissaoError
from app.core.invite_code import new_invite_code
from app.models.grupo import Grupo
from app.models.membro_grupo import MembroGrupo
from app.models.coluna_kanban import ColunaKanban
from app.schemas.groups_schema import GroupCreate, GroupInput, GroupPreview, GroupResponse

ACTIVE = ("admin", "ativo")


def require_member(db: Session, group_id: int, user_id: int, admin: bool = False):
    member = db.get(MembroGrupo, (group_id, user_id))
    if member is None or member.status not in ACTIVE:
        raise NaoEncontradoError("Grupo n\u00e3o encontrado para esta conta.")
    if admin and member.status != "admin":
        raise SemPermissaoError("Apenas administradores podem editar este grupo.")
    return member


def preview(db: Session, group: Grupo) -> GroupPreview:
    count = db.scalar(select(func.count()).select_from(MembroGrupo).where(MembroGrupo.id_grupo == group.id_grupo, MembroGrupo.status.in_(ACTIVE)))
    return GroupPreview(id=str(group.id_grupo), name=group.nome, description=group.descricao or "", category=group.categoria, icon=group.icone, members=count)


def response(db: Session, group: Grupo, member: MembroGrupo) -> GroupResponse:
    return GroupResponse(**preview(db, group).model_dump(), inviteCode=group.codigo_convite, role="admin" if member.status == "admin" else "member")


def list_groups(db: Session, user_id: int):
    rows = db.execute(select(Grupo, MembroGrupo).join(MembroGrupo, MembroGrupo.id_grupo == Grupo.id_grupo).where(MembroGrupo.id_usuario == user_id, MembroGrupo.status.in_(ACTIVE)).order_by(Grupo.id_grupo))
    return [response(db, group, member) for group, member in rows]


def discover(db: Session, user_id: int):
    membership = exists().where(MembroGrupo.id_grupo == Grupo.id_grupo, MembroGrupo.id_usuario == user_id)
    groups = db.scalars(select(Grupo).where(~membership).order_by(Grupo.id_grupo.desc()).limit(100))
    return [preview(db, group) for group in groups]


def create(db: Session, user_id: int, data: GroupCreate):
    for _ in range(5):
        group = Grupo(nome=data.name, descricao=data.description, categoria=data.category, icone=data.icon, codigo_convite=data.inviteCode or new_invite_code())
        try:
            db.add(group)
            db.flush()
            member = MembroGrupo(id_grupo=group.id_grupo, id_usuario=user_id, status="admin")
            db.add(member)
            for order, name in enumerate(["A fazer", "Em andamento", "Conclu\u00eddo"]):
                db.add(ColunaKanban(id_grupo=group.id_grupo, nome=name, ordem=order))
            db.commit()
            return response(db, group, member)
        except IntegrityError as exc:
            db.rollback()
            if getattr(exc.orig, "pgcode", None) != "23505":
                raise
            if data.inviteCode:
                raise ConflitoError("Este c\u00f3digo j\u00e1 est\u00e1 em uso. Reabra o formul\u00e1rio para gerar outro.") from exc
    raise ConflitoError("N\u00e3o foi poss\u00edvel gerar o convite. Tente novamente.")


def update(db: Session, user_id: int, group_id: int, data: GroupInput):
    member = require_member(db, group_id, user_id, admin=True)
    group = db.get(Grupo, group_id)
    group.nome, group.descricao, group.categoria, group.icone = data.name, data.description, data.category, data.icon
    db.commit()
    return response(db, group, member)


def join(db: Session, user_id: int, group_id: int | None = None, code: str | None = None):
    # Lock the group so concurrent requests cannot duplicate membership.
    condition = Grupo.id_grupo == group_id if group_id is not None else Grupo.codigo_convite == code
    group = db.scalar(select(Grupo).where(condition).with_for_update())
    if group is None:
        raise NaoEncontradoError("Grupo ou c\u00f3digo n\u00e3o encontrado.")
    if db.get(MembroGrupo, (group.id_grupo, user_id)) is not None:
        raise ConflitoError("Voc\u00ea j\u00e1 participa ou tem uma solicita\u00e7\u00e3o neste grupo.")
    member = MembroGrupo(id_grupo=group.id_grupo, id_usuario=user_id, status="ativo")
    db.add(member)
    db.commit()
    return response(db, group, member)
