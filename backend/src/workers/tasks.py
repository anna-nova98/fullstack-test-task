import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import CELERY_BROKER_URL, DB_URL, STORAGE_DIR
from src.models import Alert, StoredFile

celery_app = Celery("file_tasks", broker=CELERY_BROKER_URL, backend=CELERY_BROKER_URL)


@asynccontextmanager
async def _get_session(session: AsyncSession | None) -> AsyncGenerator[AsyncSession, None]:
    """Use provided session (for tests) or create a fresh engine+session for worker tasks."""
    if session is not None:
        yield session
    else:
        # Create a new engine per asyncio.run() call to avoid asyncpg event loop conflicts
        engine = create_async_engine(DB_URL)
        maker = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with maker() as s:
                yield s
        finally:
            await engine.dispose()


async def _scan_file_for_threats(file_id: str, session: AsyncSession | None = None) -> None:
    async with _get_session(session) as s:
        file_item = await s.get(StoredFile, file_id)
        if not file_item:
            return

        file_item.processing_status = "processing"
        await s.commit()

        reasons: list[str] = []
        extension = Path(file_item.original_name).suffix.lower()

        if extension in {".exe", ".bat", ".cmd", ".sh", ".js"}:
            reasons.append(f"suspicious extension {extension}")

        if file_item.size > 10 * 1024 * 1024:
            reasons.append("file is larger than 10 MB")

        if extension == ".pdf" and file_item.mime_type not in {"application/pdf", "application/octet-stream"}:
            reasons.append("pdf extension does not match mime type")

        file_item.scan_status = "suspicious" if reasons else "clean"
        file_item.scan_details = ", ".join(reasons) if reasons else "no threats found"
        file_item.requires_attention = bool(reasons)
        await s.commit()

    extract_file_metadata.delay(file_id)


async def _extract_file_metadata(file_id: str, session: AsyncSession | None = None) -> None:
    async with _get_session(session) as s:
        file_item = await s.get(StoredFile, file_id)
        if not file_item:
            return

        stored_path = STORAGE_DIR / file_item.stored_name
        if not stored_path.exists():
            file_item.processing_status = "failed"
            file_item.scan_status = file_item.scan_status or "failed"
            file_item.scan_details = "stored file not found during metadata extraction"
            await s.commit()
            send_file_alert.delay(file_id)
            return

        metadata: dict = {
            "extension": Path(file_item.original_name).suffix.lower(),
            "size_bytes": file_item.size,
            "mime_type": file_item.mime_type,
        }

        if file_item.mime_type.startswith("text/"):
            content = stored_path.read_text(encoding="utf-8", errors="ignore")
            metadata["line_count"] = len(content.splitlines())
            metadata["char_count"] = len(content)
        elif file_item.mime_type == "application/pdf":
            raw = stored_path.read_bytes()
            metadata["approx_page_count"] = max(raw.count(b"/Type /Page"), 1)

        file_item.metadata_json = metadata
        file_item.processing_status = "processed"
        await s.commit()

    send_file_alert.delay(file_id)


async def _send_file_alert(file_id: str, session: AsyncSession | None = None) -> None:
    async with _get_session(session) as s:
        file_item = await s.get(StoredFile, file_id)
        if not file_item:
            return

        if file_item.processing_status == "failed":
            alert = Alert(file_id=file_id, level="critical", message="File processing failed")
        elif file_item.requires_attention:
            alert = Alert(
                file_id=file_id,
                level="warning",
                message=f"File requires attention: {file_item.scan_details}",
            )
        else:
            alert = Alert(file_id=file_id, level="info", message="File processed successfully")

        s.add(alert)
        await s.commit()


@celery_app.task
def scan_file_for_threats(file_id: str) -> None:
    asyncio.run(_scan_file_for_threats(file_id))


@celery_app.task
def extract_file_metadata(file_id: str) -> None:
    asyncio.run(_extract_file_metadata(file_id))


@celery_app.task
def send_file_alert(file_id: str) -> None:
    asyncio.run(_send_file_alert(file_id))
