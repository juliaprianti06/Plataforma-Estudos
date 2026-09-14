from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.perfil_usuario import PerfilUsuario
from app.models.usuario import Usuario
from app.schemas.profile_schema import Notifications, ProfileInput, UserProfile


def get_profile(db: Session, user: Usuario) -> UserProfile:
    profile = db.get(PerfilUsuario, user.id_usuario)
    return UserProfile(
        name=user.nome,
        bio=profile.bio if profile else "",
        interests=profile.interesses if profile else [],
        avatar=profile.avatar if profile else None,
        notifications=Notifications(
            tasks=profile.notificar_tarefas if profile else True,
            groups=profile.notificar_grupos if profile else True,
        ),
        updatedAt=profile.atualizado_em if profile else None,
    )


def _lock_user(db: Session, user_id: int) -> Usuario:
    # Serialize first saves and resets for the same user; keep the initial name.
    return db.scalar(
        select(Usuario).where(Usuario.id_usuario == user_id)
        .with_for_update().execution_options(populate_existing=True)
    )


def save_profile(db: Session, user_id: int, data: ProfileInput) -> UserProfile:
    user = _lock_user(db, user_id)
    profile = db.get(PerfilUsuario, user_id)
    if profile is None:
        profile = PerfilUsuario(id_usuario=user_id, nome_inicial=user.nome)
        db.add(profile)
    user.nome = data.name
    profile.bio = data.bio
    profile.interesses = data.interests
    profile.avatar = data.avatar
    profile.notificar_tarefas = data.notifications.tasks
    profile.notificar_grupos = data.notifications.groups
    profile.atualizado_em = datetime.now(timezone.utc)
    db.commit()
    return get_profile(db, user)


def reset_profile(db: Session, user_id: int) -> UserProfile:
    user = _lock_user(db, user_id)
    profile = db.get(PerfilUsuario, user_id)
    if profile is not None:
        user.nome = profile.nome_inicial
        db.delete(profile)
    db.commit()
    return get_profile(db, user)
