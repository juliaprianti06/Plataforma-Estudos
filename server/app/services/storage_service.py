import os
import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = Path("uploads")
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
        if not url_arquivo.startswith("/uploads/"):
            return

        filename = url_arquivo.replace("/uploads/", "")
        file_path = UPLOAD_DIR / filename
        
        if file_path.exists() and file_path.is_file():
            os.remove(file_path)
