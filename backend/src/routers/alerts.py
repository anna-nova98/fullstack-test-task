from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.schemas import AlertItem, PagedResponse
from src.services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=PagedResponse[AlertItem])
async def list_alerts_view(
    offset: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
):
    alerts, total = await alert_service.list_alerts(session, offset=offset, limit=limit)
    return PagedResponse(items=alerts, total=total, offset=offset, limit=limit)
