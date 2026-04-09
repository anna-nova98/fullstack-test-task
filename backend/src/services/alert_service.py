from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Alert
from src.repositories import alert_repo


async def list_alerts(session: AsyncSession, offset: int, limit: int) -> tuple[list[Alert], int]:
    alerts = await alert_repo.get_all(session, offset=offset, limit=limit)
    total = await alert_repo.count_all(session)
    return alerts, total
