import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.workers.tasks import _scan_file_for_threats, _send_file_alert
from src.models import StoredFile, Alert


def make_file(**kwargs) -> StoredFile:
    defaults = dict(
        id="test-id",
        title="Test",
        original_name="test.txt",
        stored_name="test-id.txt",
        mime_type="text/plain",
        size=100,
        processing_status="uploaded",
        scan_status=None,
        scan_details=None,
        requires_attention=False,
        metadata_json=None,
    )
    defaults.update(kwargs)
    return StoredFile(**defaults)


@pytest.mark.asyncio
async def test_scan_clean_file(session: AsyncSession):
    file_item = make_file(id="clean-id")
    session.add(file_item)
    await session.commit()

    with patch("src.workers.tasks.extract_file_metadata") as mock_next:
        mock_next.delay = MagicMock()
        await _scan_file_for_threats("clean-id", session=session)
        mock_next.delay.assert_called_once_with("clean-id")

    await session.refresh(file_item)
    assert file_item.scan_status == "clean"
    assert file_item.requires_attention is False
    assert file_item.processing_status == "processing"


@pytest.mark.asyncio
async def test_scan_suspicious_extension(session: AsyncSession):
    file_item = make_file(id="exe-id", original_name="malware.exe", stored_name="exe-id.exe")
    session.add(file_item)
    await session.commit()

    with patch("src.workers.tasks.extract_file_metadata") as mock_next:
        mock_next.delay = MagicMock()
        await _scan_file_for_threats("exe-id", session=session)

    await session.refresh(file_item)
    assert file_item.scan_status == "suspicious"
    assert file_item.requires_attention is True
    assert ".exe" in file_item.scan_details


@pytest.mark.asyncio
async def test_scan_large_file(session: AsyncSession):
    file_item = make_file(id="big-id", size=11 * 1024 * 1024)
    session.add(file_item)
    await session.commit()

    with patch("src.workers.tasks.extract_file_metadata") as mock_next:
        mock_next.delay = MagicMock()
        await _scan_file_for_threats("big-id", session=session)

    await session.refresh(file_item)
    assert file_item.scan_status == "suspicious"
    assert "10 MB" in file_item.scan_details


@pytest.mark.asyncio
async def test_scan_nonexistent_file_id(session: AsyncSession):
    # should return silently without error
    await _scan_file_for_threats("does-not-exist", session=session)


@pytest.mark.asyncio
async def test_send_alert_info(session: AsyncSession):
    file_item = make_file(id="alert-info-id", processing_status="processed", requires_attention=False)
    session.add(file_item)
    await session.commit()

    await _send_file_alert("alert-info-id", session=session)

    result = await session.execute(select(Alert).where(Alert.file_id == "alert-info-id"))
    alert = result.scalar_one()
    assert alert.level == "info"


@pytest.mark.asyncio
async def test_send_alert_warning(session: AsyncSession):
    file_item = make_file(
        id="alert-warn-id",
        processing_status="processed",
        requires_attention=True,
        scan_details="suspicious extension .exe",
    )
    session.add(file_item)
    await session.commit()

    await _send_file_alert("alert-warn-id", session=session)

    result = await session.execute(select(Alert).where(Alert.file_id == "alert-warn-id"))
    alert = result.scalar_one()
    assert alert.level == "warning"


@pytest.mark.asyncio
async def test_send_alert_critical(session: AsyncSession):
    file_item = make_file(id="alert-crit-id", processing_status="failed")
    session.add(file_item)
    await session.commit()

    await _send_file_alert("alert-crit-id", session=session)

    result = await session.execute(select(Alert).where(Alert.file_id == "alert-crit-id"))
    alert = result.scalar_one()
    assert alert.level == "critical"


from src.workers.tasks import _extract_file_metadata


@pytest.mark.asyncio
async def test_extract_metadata_missing_file(session: AsyncSession, tmp_path, monkeypatch):
    """When stored file is missing on disk, status becomes failed and alert is queued."""
    import src.core.config as cfg
    monkeypatch.setattr(cfg, "STORAGE_DIR", tmp_path)
    import src.workers.tasks as wt
    monkeypatch.setattr(wt, "STORAGE_DIR", tmp_path)

    file_item = make_file(id="meta-missing-id", stored_name="meta-missing-id.txt")
    session.add(file_item)
    await session.commit()

    with patch("src.workers.tasks.send_file_alert") as mock_alert:
        mock_alert.delay = MagicMock()
        await _extract_file_metadata("meta-missing-id", session=session)
        mock_alert.delay.assert_called_once_with("meta-missing-id")

    await session.refresh(file_item)
    assert file_item.processing_status == "failed"


@pytest.mark.asyncio
async def test_extract_metadata_text_file(session: AsyncSession, tmp_path, monkeypatch):
    """Text files get line_count and char_count in metadata."""
    import src.core.config as cfg
    monkeypatch.setattr(cfg, "STORAGE_DIR", tmp_path)
    import src.workers.tasks as wt
    monkeypatch.setattr(wt, "STORAGE_DIR", tmp_path)

    stored = tmp_path / "text-meta-id.txt"
    stored.write_text("line one\nline two\nline three")

    file_item = make_file(
        id="text-meta-id",
        stored_name="text-meta-id.txt",
        mime_type="text/plain",
    )
    session.add(file_item)
    await session.commit()

    with patch("src.workers.tasks.send_file_alert") as mock_alert:
        mock_alert.delay = MagicMock()
        await _extract_file_metadata("text-meta-id", session=session)

    await session.refresh(file_item)
    assert file_item.processing_status == "processed"
    assert file_item.metadata_json is not None
    assert file_item.metadata_json["line_count"] == 3
    assert file_item.metadata_json["char_count"] == 27
