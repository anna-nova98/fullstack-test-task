import io
import pytest
from httpx import AsyncClient


async def upload_file(client: AsyncClient, title: str = "Test file", filename: str = "test.txt", content: bytes = b"hello") -> dict:
    response = await client.post(
        "/files",
        data={"title": title},
        files={"file": (filename, io.BytesIO(content), "text/plain")},
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_upload_file(client: AsyncClient):
    data = await upload_file(client)
    assert data["title"] == "Test file"
    assert data["original_name"] == "test.txt"
    assert data["processing_status"] == "uploaded"
    assert data["mime_type"] == "text/plain"
    assert data["size"] == 5


@pytest.mark.asyncio
async def test_upload_empty_file_returns_400(client: AsyncClient):
    response = await client.post(
        "/files",
        data={"title": "Empty"},
        files={"file": ("empty.txt", io.BytesIO(b""), "text/plain")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_files_pagination(client: AsyncClient):
    # upload 3 files
    for i in range(3):
        await upload_file(client, title=f"File {i}", content=b"data")

    resp = await client.get("/files?offset=0&limit=2")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert len(body["items"]) <= 2
    assert body["limit"] == 2
    assert body["offset"] == 0
    assert body["total"] >= 3


@pytest.mark.asyncio
async def test_get_file(client: AsyncClient):
    data = await upload_file(client)
    file_id = data["id"]

    resp = await client.get(f"/files/{file_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == file_id


@pytest.mark.asyncio
async def test_get_file_not_found(client: AsyncClient):
    resp = await client.get("/files/nonexistent-id")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_file(client: AsyncClient):
    data = await upload_file(client)
    file_id = data["id"]

    resp = await client.patch(f"/files/{file_id}", json={"title": "Updated title"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated title"


@pytest.mark.asyncio
async def test_update_file_not_found(client: AsyncClient):
    resp = await client.patch("/files/nonexistent-id", json={"title": "X"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_file(client: AsyncClient):
    data = await upload_file(client)
    file_id = data["id"]

    resp = await client.delete(f"/files/{file_id}")
    assert resp.status_code == 204

    resp = await client.get(f"/files/{file_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_file_not_found(client: AsyncClient):
    resp = await client.delete("/files/nonexistent-id")
    assert resp.status_code == 404
