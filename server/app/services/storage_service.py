import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 20 * 1024 * 1024 

class StorageService:
    @staticmethod
    async def save_file(file: UploadFile) -> tuple[str, str, int]:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max size is 20MB.")
        
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        content_type = file.content_type or "application/octet-stream"
        
        return f"/uploads/{unique_filename}", content_type, file_size

    @staticmethod
    def delete_file(url_arquivo: str) -> None:
        file_path = StorageService._upload_path(url_arquivo)
        if file_path is None:
            return
        if file_path.exists() and file_path.is_file():
            os.remove(file_path)

    @staticmethod
    def stage_delete_file(url_arquivo: str) -> Path | None:
        """Move a file out of uploads so a failed database commit can restore it."""
        file_path = StorageService._upload_path(url_arquivo)
        if file_path is None or not file_path.is_file():
            return None
        trash_dir = Path(UPLOAD_DIR) / ".trash"
        trash_dir.mkdir(parents=True, exist_ok=True)
        staged_path = trash_dir / f"{uuid.uuid4().hex}-{file_path.name}"
        os.replace(file_path, staged_path)
        return staged_path

    @staticmethod
    def restore_staged_file(url_arquivo: str, staged_path: Path | None) -> None:
        if staged_path is None or not staged_path.exists():
            return
        file_path = StorageService._upload_path(url_arquivo)
        if file_path is None:
            raise ValueError("Caminho do material inválido; não foi possível restaurar o arquivo.")
        os.replace(staged_path, file_path)

    @staticmethod
    def finalize_staged_delete(staged_path: Path | None) -> None:
        if staged_path is not None:
            staged_path.unlink(missing_ok=True)

    @staticmethod
    def _upload_path(url_arquivo: str) -> Path | None:
        if not url_arquivo.startswith("/uploads/"):
            return None
        filename = url_arquivo.removeprefix("/uploads/")
        root = Path(UPLOAD_DIR).resolve()
        file_path = (root / filename).resolve()
        if Path(filename).name != filename or file_path.parent != root:
            return None
        return file_path
