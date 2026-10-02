from fastapi import APIRouter, Response

from app.routers.auth_router import CurrentAuth, Database
from app.schemas.profile_schema import ProfileExport, ProfileInput, UserProfile
from app.services import profile_service

router = APIRouter()


@router.get("/me", response_model=UserProfile)
def me(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return profile_service.get_profile(db, auth.user)


@router.put("/me", response_model=UserProfile)
def update(data: ProfileInput, db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    return profile_service.save_profile(db, auth.user.id_usuario, data)


@router.delete("/me", response_model=UserProfile)
def reset(db: Database, auth: CurrentAuth, response: Response):
    """Restore personalization; retain the account, sessions and group memberships."""
    response.headers["Cache-Control"] = "no-store"
    return profile_service.reset_profile(db, auth.user.id_usuario)


@router.get("/me/export", response_model=ProfileExport)
def export(db: Database, auth: CurrentAuth, response: Response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Disposition"] = 'attachment; filename="meu-perfil-mindspace.json"'
    profile = profile_service.get_profile(db, auth.user)
    return ProfileExport(**profile.model_dump(), email=auth.user.email)
