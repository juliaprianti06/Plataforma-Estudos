from pathlib import Path

from fastapi.responses import FileResponse
from sqlalchemy import exists, or_, select

from app.core.exceptions import NaoEncontradoError
from app.models.material import Material
from app.models.material_grupo import MaterialGrupo
from app.models.membro_grupo import MembroGrupo


def accessible_file(db, user_id, filename):
    shared = exists().where(
        MaterialGrupo.id_material == Material.id_material,
        MembroGrupo.id_grupo == MaterialGrupo.id_grupo,
        MembroGrupo.id_usuario == user_id,
        MembroGrupo.status.in_(('admin', 'ativo')),
    )
    material = db.scalar(select(Material).where(
        Material.url_arquivo == f'/uploads/{filename}',
        or_(Material.id_usuario == user_id, shared),
    ))
    if material is None:
        raise NaoEncontradoError('Arquivo não encontrado para esta conta.')
    return file_response(material)


def file_response(material):
    root = Path('uploads').resolve()
    path = (root / Path(material.url_arquivo).name).resolve()
    if path.parent != root or not path.is_file():
        raise NaoEncontradoError('Arquivo indisponível.')
    return FileResponse(path, filename=f'{material.titulo}{path.suffix}',
                        media_type=material.content_type, headers={'Cache-Control': 'no-store'})
