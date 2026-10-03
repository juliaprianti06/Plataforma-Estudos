from fastapi import APIRouter

from app.routers.auth_router import CurrentAuth, Database
from app.services.material_download_service import accessible_file

router = APIRouter()


@router.get('/{filename}')
def download(filename: str, db: Database, auth: CurrentAuth):
    return accessible_file(db, auth.user.id_usuario, filename)
