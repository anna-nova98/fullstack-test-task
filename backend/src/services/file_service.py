import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import STORAGE_DIR
from src.models import StoredFile
from src.repositories import file_repo


async def list_files(session: AsyncSession, offset: int, limit: int) -> tuple[list[StoredFile], int]:
    files = await file_repo.get_all(session, offset=offset, limit=limit)
    total = await file_repo.count_all(session)
    return files, total


async def get_file(session: AsyncSession, file_id: str) -> StoredFile:
    file_item = await file_repo.get_by_id(session, file_id)
    if not file_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return file_item


async def create_file(session: AsyncSession, title: str, upload_file: UploadFile) -> StoredFile:
    content = await upload_file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid4())
    suffix = Path(upload_file.filename or "").suffix
    stored_name = f"{file_id}{suffix}"
    stored_path = STORAGE_DIR / stored_name
    stored_path.write_bytes(content)

    file_item = StoredFile(
        id=file_id,
        title=title,
        original_name=upload_file.filename or stored_name,
        stored_name=stored_name,
        mime_type=(
            upload_file.content_type
            or mimetypes.guess_type(stored_name)[0]
            or "application/octet-stream"
        ),
        size=len(content),
        processing_status="uploaded",
    )
    return await file_repo.save(session, file_item)


async def update_file(session: AsyncSession, file_id: str, title: str) -> StoredFile:
    file_item = await get_file(session, file_id)
    file_item.title = title
    return await file_repo.save(session, file_item)


async def delete_file(session: AsyncSession, file_id: str) -> None:
    file_item = await get_file(session, file_id)
    stored_path = STORAGE_DIR / file_item.stored_name
    if stored_path.exists():
        stored_path.unlink()
    await file_repo.delete(session, file_item)
