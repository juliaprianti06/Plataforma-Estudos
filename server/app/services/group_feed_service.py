from sqlalchemy import select

from app.core.exceptions import NaoEncontradoError, SemPermissaoError
from app.models.atividade_grupo import AtividadeGrupo
from app.models.grupo import Grupo
from app.models.material_grupo import MaterialGrupo
from app.models.perfil_usuario import PerfilUsuario
from app.models.usuario import Usuario
from app.schemas.groups_schema import ActivityActor, ActivityMaterial, GroupActivity, GroupFeed
from app.services.groups_service import lock_group, require_member


def response(db, activity, member):
    user = db.get(Usuario, activity.id_usuario) if activity.id_usuario is not None else None
    profile = db.get(PerfilUsuario, activity.id_usuario) if user else None
    shared = (activity.id_material is not None and
              db.get(MaterialGrupo, (activity.id_material, activity.id_grupo)) is not None)
    return GroupActivity(id=activity.id, kind=activity.tipo,
        actor=ActivityActor(id=activity.id_usuario, name=user.nome if user else 'Ex-participante', avatar=profile.avatar if profile else None),
        createdAt=activity.criado_em, text=activity.texto,
        material=ActivityMaterial(id=activity.id_material, title=activity.titulo_material or 'Material removido', size=activity.tamanho_material or 0, available=shared) if activity.tipo == 'material' else None,
        canDelete=(activity.tipo == 'comment' and not db.get(Grupo, activity.id_grupo).arquivado and
                   (member.status == 'admin' or member.id_usuario == activity.id_usuario)))


def list_feed(db, user_id, group_id, before=None):
    member = require_member(db, group_id, user_id)
    query = select(AtividadeGrupo).where(AtividadeGrupo.id_grupo == group_id)
    if before is not None:
        query = query.where(AtividadeGrupo.id < before)
    activities = db.scalars(query.order_by(AtividadeGrupo.id.desc()).limit(31)).all()
    items = [response(db, activity, member) for activity in activities[:30]]
    return GroupFeed(items=items, nextCursor=items[-1].id if len(activities) > 30 else None)


def comment(db, user_id, group_id, text):
    lock_group(db, group_id)
    member = require_member(db, group_id, user_id, write=True)
    activity = AtividadeGrupo(id_grupo=group_id, id_usuario=user_id, tipo='comment', texto=text)
    db.add(activity)
    db.commit()
    return response(db, activity, member)


def remove_comment(db, user_id, group_id, activity_id):
    lock_group(db, group_id)
    member = require_member(db, group_id, user_id, write=True)
    activity = db.get(AtividadeGrupo, activity_id)
    if activity is None or activity.id_grupo != group_id or activity.tipo != 'comment':
        raise NaoEncontradoError('Comentário não encontrado neste grupo.')
    if member.status != 'admin' and activity.id_usuario != user_id:
        raise SemPermissaoError('Apenas o autor ou um administrador pode excluir o comentário.')
    db.delete(activity)
    db.commit()
