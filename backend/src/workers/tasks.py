import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from celery import Celery
from celery.utils.log import get_task_logger
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import CELERY_BROKER_URL, DB_URL, STORAGE_DIR
from src.models import Alert, AlertLevel, ProcessingStatus, ScanStatus, StoredFile

logger = get_task_logger(__name__)

celery_app = Celery("file_tasks", broker=CELERY_BROKER_URL, backend=CELERY_BROKER_URL)
celery_app.conf.task_acks_late = True
celery_app.conf.task_reject_on_worker_lost = True


@asynccontextmanager
async def _get_session(session: AsyncSession | None) -> AsyncGenerator[AsyncSession, None]:
    """Use provided session (for tests) or create a fresh engine+session for worker tasks."""
    if session is not None:
        yield session
    else:
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
            logger.warning("scan: file %s not found", file_id)
            return

        file_item.processing_status = ProcessingStatus.processing
        await s.commit()

        reasons: list[str] = []
        extension = Path(file_item.original_name).suffix.lower()

        if extension in {".exe", ".bat", ".cmd", ".sh", ".js"}:
            reasons.append(f"suspicious extension {extension}")

        if file_item.size > 10 * 1024 * 1024:
            reasons.append("file is larger than 10 MB")

        if extension == ".pdf" and file_item.mime_type not in {"application/pdf", "application/octet-stream"}:
            reasons.append("pdf extension does not match mime type")

        file_item.scan_status = ScanStatus.suspicious if reasons else ScanStatus.clean
        file_item.scan_details = ", ".join(reasons) if reasons else "no threats found"
        file_item.requires_attention = bool(reasons)
        await s.commit()

    extract_file_metadata.delay(file_id)


async def _extract_file_metadata(file_id: str, session: AsyncSession | None = None) -> None:
    async with _get_session(session) as s:
        file_item = await s.get(StoredFile, file_id)
        if not file_item:
            logger.warning("metadata: file %s not found", file_id)
            return

        stored_path = STORAGE_DIR / file_item.stored_name
        if not stored_path.exists():
            file_item.processing_status = ProcessingStatus.failed
            file_item.scan_status = file_item.scan_status or ScanStatus.failed
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
        file_item.processing_status = ProcessingStatus.processed
        await s.commit()

    send_file_alert.delay(file_id)


async def _send_file_alert(file_id: str, session: AsyncSession | None = None) -> None:
    async with _get_session(session) as s:
        file_item = await s.get(StoredFile, file_id)
        if not file_item:
            logger.warning("alert: file %s not found", file_id)
            return

        if file_item.processing_status == ProcessingStatus.failed:
            alert = Alert(file_id=file_id, level=AlertLevel.critical, message="File processing failed")
        elif file_item.requires_attention:
            alert = Alert(
                file_id=file_id,
                level=AlertLevel.warning,
                message=f"File requires attention: {file_item.scan_details}",
            )
        else:
            alert = Alert(file_id=file_id, level=AlertLevel.info, message="File processed successfully")

        s.add(alert)
        await s.commit()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def scan_file_for_threats(self, file_id: str) -> None:
    try:
        asyncio.run(_scan_file_for_threats(file_id))
    except Exception as exc:
        logger.error("scan_file_for_threats failed for %s: %s", file_id, exc)
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def extract_file_metadata(self, file_id: str) -> None:
    try:
        asyncio.run(_extract_file_metadata(file_id))
    except Exception as exc:
        logger.error("extract_file_metadata failed for %s: %s", file_id, exc)
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def send_file_alert(self, file_id: str) -> None:
    try:
        asyncio.run(_send_file_alert(file_id))
    except Exception as exc:
        logger.error("send_file_alert failed for %s: %s", file_id, exc)
        raise self.retry(exc=exc)
