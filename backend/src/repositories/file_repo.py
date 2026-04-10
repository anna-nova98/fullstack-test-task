from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import StoredFile


async def get_all(session: AsyncSession, offset: int = 0, limit: int = 20) -> list[StoredFile]:
    result = await session.execute(
        select(StoredFile)
        .order_by(StoredFile.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_all(session: AsyncSession) -> int:
    result = await session.execute(select(func.count()).select_from(StoredFile))
    return result.scalar_one()


async def get_by_id(session: AsyncSession, file_id: str) -> StoredFile | None:
    return await session.get(StoredFile, file_id)


async def save(session: AsyncSession, file_item: StoredFile) -> StoredFile:
    session.add(file_item)
    await session.commit()
    await session.refresh(file_item)
    return file_item


async def delete(session: AsyncSession, file_item: StoredFile) -> None:
    await session.delete(file_item)
    await session.commit()
