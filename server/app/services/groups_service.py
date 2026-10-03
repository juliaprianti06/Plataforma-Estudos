from datetime import datetime, timezone
from sqlalchemy import delete, exists, func, select, update as sql_update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflitoError, NaoEncontradoError, SemPermissaoError
from app.core.invite_code import new_invite_code
from app.models.grupo import Grupo
from app.models.membro_grupo import MembroGrupo
from app.models.coluna_kanban import ColunaKanban
from app.models.usuario import Usuario
from app.models.perfil_usuario import PerfilUsuario
from app.models.tarefa import Tarefa
from app.models.tarefa_responsavel import TarefaResponsavel
from app.models.material import Material
from app.models.material_grupo import MaterialGrupo
from app.models.atividade_grupo import AtividadeGrupo
from app.repository.material_repository import MaterialRepository
from app.schemas.material_schema import MaterialResponse
from app.schemas.groups_schema import MemberResponse
from app.schemas.groups_schema import GroupCreate, GroupInput, GroupPreview, GroupResponse

ACTIVE = ("admin", "ativo")


def require_member(db: Session, group_id: int, user_id: int, admin: bool = False, write: bool = False):
    group = db.get(Grupo, group_id)
    member = db.get(MembroGrupo, (group_id, user_id))
    if group is None or group.excluido_em is not None or member is None or member.status not in ACTIVE:
        raise NaoEncontradoError("Grupo n\u00e3o encontrado para esta conta.")
    if admin and member.status != "admin":
        raise SemPermissaoError("Apenas administradores podem editar este grupo.")
    if write and group.arquivado:
        raise ConflitoError('Este grupo está arquivado. Um administrador pode reativá-lo.')
    return member


def preview(db: Session, group: Grupo) -> GroupPreview:
    count = db.scalar(select(func.count()).select_from(MembroGrupo).where(MembroGrupo.id_grupo == group.id_grupo, MembroGrupo.status.in_(ACTIVE)))
    return GroupPreview(id=str(group.id_grupo), name=group.nome, description=group.descricao or "", category=group.categoria, icon=group.icone, members=count, private=group.privado, archived=group.arquivado)


def response(db: Session, group: Grupo, member: MembroGrupo) -> GroupResponse:
    return GroupResponse(**preview(db, group).model_dump(), inviteCode=group.codigo_convite, role="admin" if member.status == "admin" else "member")


def list_groups(db: Session, user_id: int):
    rows = db.execute(select(Grupo, MembroGrupo).join(MembroGrupo, MembroGrupo.id_grupo == Grupo.id_grupo).where(MembroGrupo.id_usuario == user_id, MembroGrupo.status.in_(ACTIVE), Grupo.excluido_em.is_(None)).order_by(Grupo.id_grupo))
    return [response(db, group, member) for group, member in rows]


def discover(db: Session, user_id: int):
    membership = exists().where(MembroGrupo.id_grupo == Grupo.id_grupo, MembroGrupo.id_usuario == user_id, MembroGrupo.status != 'saiu')
    groups = db.scalars(select(Grupo).where(~membership, Grupo.privado.is_(False), Grupo.arquivado.is_(False), Grupo.excluido_em.is_(None)).order_by(Grupo.id_grupo.desc()).limit(100))
    return [preview(db, group) for group in groups]


def create(db: Session, user_id: int, data: GroupCreate):
    for _ in range(5):
        group = Grupo(nome=data.name, descricao=data.description, categoria=data.category, icone=data.icon, codigo_convite=data.inviteCode or new_invite_code(), privado=data.private)
        try:
            db.add(group)
            db.flush()
            member = MembroGrupo(id_grupo=group.id_grupo, id_usuario=user_id, status="admin")
            db.add(member)
            db.add(AtividadeGrupo(id_grupo=group.id_grupo, id_usuario=user_id, tipo='joined'))
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
    member = require_member(db, group_id, user_id, admin=True, write=True)
    group = db.get(Grupo, group_id)
    group.nome, group.descricao, group.categoria, group.icone = data.name, data.description, data.category, data.icon
    group.privado = data.private
    db.commit()
    return response(db, group, member)


def join(db: Session, user_id: int, group_id: int | None = None, code: str | None = None):
    # Lock the group so concurrent requests cannot duplicate membership.
    condition = Grupo.id_grupo == group_id if group_id is not None else Grupo.codigo_convite == code
    group = db.scalar(select(Grupo).where(condition).with_for_update())
    if group is None or group.excluido_em is not None:
        raise NaoEncontradoError("Grupo ou c\u00f3digo n\u00e3o encontrado.")
    if group.arquivado or (group.privado and code is None):
        raise NaoEncontradoError('Grupo ou código não encontrado.')
    existing = db.get(MembroGrupo, (group.id_grupo, user_id))
    if existing is not None and existing.status != 'saiu':
        raise ConflitoError("Voc\u00ea j\u00e1 participa ou tem uma solicita\u00e7\u00e3o neste grupo.")
    member = existing or MembroGrupo(id_grupo=group.id_grupo, id_usuario=user_id)
    member.status = 'ativo'
    db.add(member)
    db.add(AtividadeGrupo(id_grupo=group.id_grupo, id_usuario=user_id, tipo='joined'))
    db.commit()
    return response(db, group, member)


def members(db, user_id, group_id):
    require_member(db, group_id, user_id)
    rows = db.execute(select(Usuario, MembroGrupo, PerfilUsuario.avatar).join(
        MembroGrupo, MembroGrupo.id_usuario == Usuario.id_usuario,
    ).outerjoin(PerfilUsuario, PerfilUsuario.id_usuario == Usuario.id_usuario).where(
        MembroGrupo.id_grupo == group_id, MembroGrupo.status.in_(ACTIVE),
    ).order_by(Usuario.nome, Usuario.id_usuario))
    return [MemberResponse(id=user.id_usuario, name=user.nome, email=user.email, role='admin' if member.status == 'admin' else 'member', avatar=avatar) for user, member, avatar in rows]


def lock_group(db, group_id):
    group = db.scalar(select(Grupo).where(Grupo.id_grupo == group_id).with_for_update())
    if group is None or group.excluido_em is not None:
        raise NaoEncontradoError('Grupo não encontrado.')
    return group


def protect_last_admin(db, group_id, member):
    if member.status == 'admin' and db.scalar(select(func.count()).select_from(MembroGrupo).where(
        MembroGrupo.id_grupo == group_id, MembroGrupo.status == 'admin',
    )) <= 1:
        raise ConflitoError('Promova outro administrador antes de sair, remover ou alterar o último administrador.')


def clear_participation(db, group_id, member, status):
    task_ids = select(Tarefa.id).join(ColunaKanban, ColunaKanban.id_coluna == Tarefa.id_coluna).where(ColunaKanban.id_grupo == group_id)
    db.execute(delete(TarefaResponsavel).where(TarefaResponsavel.id_tarefa.in_(task_ids), TarefaResponsavel.id_usuario == member.id_usuario))
    own_materials = select(Material.id_material).where(Material.id_usuario == member.id_usuario)
    db.execute(delete(MaterialGrupo).where(MaterialGrupo.id_grupo == group_id, MaterialGrupo.id_material.in_(own_materials)))
    member.status = status
    db.commit()


def leave(db, user_id, group_id):
    group = lock_group(db, group_id)
    member = require_member(db, group_id, user_id)
    if not group.arquivado:
        protect_last_admin(db, group_id, member)
    clear_participation(db, group_id, member, 'saiu')


def change_member(db, user_id, group_id, member_id, role=None):
    lock_group(db, group_id)
    require_member(db, group_id, user_id, admin=True, write=True)
    target = require_member(db, group_id, member_id)
    if role != 'admin':
        protect_last_admin(db, group_id, target)
    if role is None:
        clear_participation(db, group_id, target, 'removido')
    else:
        target.status = 'admin' if role == 'admin' else 'ativo'
        db.commit()


def archive(db, user_id, group_id, archived):
    group = lock_group(db, group_id)
    member = require_member(db, group_id, user_id, admin=True)
    group.arquivado = archived
    db.commit()
    return response(db, group, member)


def rotate_invite(db, user_id, group_id):
    for _ in range(5):
        group = lock_group(db, group_id)
        member = require_member(db, group_id, user_id, admin=True, write=True)
        previous = group.codigo_convite
        group.codigo_convite = new_invite_code()
        if group.codigo_convite == previous:
            continue
        try:
            db.commit()
            return response(db, group, member)
        except IntegrityError:
            db.rollback()
    raise ConflitoError('Não foi possível renovar o convite. Tente novamente.')


def materials(db, user_id, group_id):
    require_member(db, group_id, user_id)
    return db.scalars(select(Material).join(MaterialGrupo, MaterialGrupo.id_material == Material.id_material).where(
        MaterialGrupo.id_grupo == group_id,
    ).order_by(Material.data_upload.desc(), Material.id_material)).all()


def share_material(db, user_id, group_id, material_id):
    lock_group(db, group_id)
    require_member(db, group_id, user_id, write=True)
    material = MaterialRepository(db).buscar_por_id(material_id, user_id)
    if material is None:
        raise NaoEncontradoError('Material não encontrado para esta conta.')
    if db.get(MaterialGrupo, (material_id, group_id)) is None:
        db.add(MaterialGrupo(id_material=material_id, id_grupo=group_id))
        db.add(AtividadeGrupo(id_grupo=group_id, id_usuario=user_id, tipo='material',
                             id_material=material_id, titulo_material=material.titulo, tamanho_material=material.tamanho_bytes))
        db.commit()
    return MaterialResponse.model_validate(material)


def unshare_material(db, user_id, group_id, material_id):
    member = require_member(db, group_id, user_id, write=True)
    share = db.get(MaterialGrupo, (material_id, group_id))
    material = db.get(Material, material_id)
    if share is None or material is None:
        raise NaoEncontradoError('Material não encontrado neste grupo.')
    if member.status != 'admin' and material.id_usuario != user_id:
        raise SemPermissaoError('Apenas o dono ou um administrador pode remover o compartilhamento.')
    db.delete(share)
    db.commit()


def assign_responsibilities(db, user_id, group_id, task_id, user_ids):
    lock_group(db, group_id)
    require_member(db, group_id, user_id, admin=True, write=True)
    task = db.get(Tarefa, task_id)
    column = db.get(ColunaKanban, task.id_coluna) if task and task.id_coluna else None
    if column is None or column.id_grupo != group_id:
        raise NaoEncontradoError('Tarefa não encontrada neste grupo.')
    for person_id in set(user_ids):
        require_member(db, group_id, person_id)
    db.execute(delete(TarefaResponsavel).where(TarefaResponsavel.id_tarefa == task_id))
    for person_id in set(user_ids):
        db.add(TarefaResponsavel(id_tarefa=task_id, id_usuario=person_id))
    db.commit()


def remove_group(db, user_id, group_id):
    group = lock_group(db, group_id)
    require_member(db, group_id, user_id, admin=True)
    task_ids = select(Tarefa.id).join(ColunaKanban, ColunaKanban.id_coluna == Tarefa.id_coluna).where(ColunaKanban.id_grupo == group_id)
    db.execute(delete(TarefaResponsavel).where(TarefaResponsavel.id_tarefa.in_(task_ids)))
    db.execute(delete(MaterialGrupo).where(MaterialGrupo.id_grupo == group_id))
    db.execute(sql_update(MembroGrupo).where(MembroGrupo.id_grupo == group_id).values(status='removido'))
    group.excluido_em = datetime.now(timezone.utc)
    group.arquivado = True
    db.commit()
