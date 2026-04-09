from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Alert


async def get_all(session: AsyncSession, offset: int = 0, limit: int = 20) -> list[Alert]:
    result = await session.execute(
        select(Alert)
        .order_by(Alert.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_all(session: AsyncSession) -> int:
    result = await session.execute(select(Alert))
    return len(result.scalars().all())


async def save(session: AsyncSession, alert: Alert) -> Alert:
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    return alert
