import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Alert


async def seed_alert(session: AsyncSession, file_id: str, level: str = "info", message: str = "ok") -> Alert:
    alert = Alert(file_id=file_id, level=level, message=message)
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    return alert


@pytest.mark.asyncio
async def test_list_alerts_empty(client: AsyncClient):
    resp = await client.get("/alerts")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert isinstance(body["items"], list)


@pytest.mark.asyncio
async def test_list_alerts_pagination(client: AsyncClient, session: AsyncSession):
    import io

    # create a file first (alerts have FK to files)
    resp = await client.post(
        "/files",
        data={"title": "Alert test file"},
        files={"file": ("a.txt", io.BytesIO(b"content"), "text/plain")},
    )
    assert resp.status_code == 201
    file_id = resp.json()["id"]

    for i in range(5):
        await seed_alert(session, file_id=file_id, level="info", message=f"msg {i}")

    resp = await client.get("/alerts?offset=0&limit=3")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) <= 3
    assert body["limit"] == 3
    assert body["total"] >= 5


@pytest.mark.asyncio
async def test_list_alerts_second_page(client: AsyncClient, session: AsyncSession):
    import io

    resp = await client.post(
        "/files",
        data={"title": "Page test file"},
        files={"file": ("b.txt", io.BytesIO(b"content"), "text/plain")},
    )
    file_id = resp.json()["id"]

    for i in range(4):
        await seed_alert(session, file_id=file_id, message=f"page msg {i}")

    first = await client.get("/alerts?offset=0&limit=2")
    second = await client.get("/alerts?offset=2&limit=2")

    first_ids = [a["id"] for a in first.json()["items"]]
    second_ids = [a["id"] for a in second.json()["items"]]
    assert not set(first_ids) & set(second_ids)
