"""
Client Portal - Dashboard Endpoints
"""

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.client import ClientDashboardStats
from app.services.client_service import ClientService

router = APIRouter(prefix="/client/dashboard", tags=["Client Portal - Dashboard"])


@router.get("/stats", response_model=ClientDashboardStats)
@require_permission(Permission.CLIENT_VIEW_PROFILE)
async def get_client_dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ClientDashboardStats:
    """
    Get dashboard statistics for the current client
    
    Returns aggregated statistics including:
    - Order counts and totals
    - Invoice counts and amounts
    - Project counts
    - Support ticket counts
    """
    service = ClientService(db)
    stats = await service.get_client_dashboard_stats(user_id=current_user.id)
    
    return ClientDashboardStats(**stats)

