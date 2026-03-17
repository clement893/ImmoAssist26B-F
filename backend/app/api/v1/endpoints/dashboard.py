"""
Dashboard Endpoints
Endpoints pour le dashboard des courtiers immobiliers
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import logger
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import BrokerDashboardStats
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=BrokerDashboardStats)
async def get_broker_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> BrokerDashboardStats:
    """
    Récupère les statistiques du dashboard pour le courtier immobilier connecté
    
    Retourne:
    - Statistiques des transactions (total, actives, conditionnelles, conclues, annulées)
    - Statistiques des contacts et entreprises
    - Statistiques financières (commissions totales, en attente, conclues)
    - Événements à venir
    - Statistiques des formulaires
    """
    try:
        service = DashboardService(db)
        stats = await service.get_broker_dashboard_stats(current_user.id)
        return stats
    except Exception as e:
        logger.error(f"Error getting broker dashboard stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard statistics"
        )
