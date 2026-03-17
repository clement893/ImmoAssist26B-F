"""
ERP Portal - Reports Endpoints
Placeholder for when Report model is implemented
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/erp/reports", tags=["ERP Portal - Reports"])


@router.get("/")
@require_permission(Permission.ERP_VIEW_REPORTS)
async def get_erp_reports(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    report_type: Optional[str] = Query(None),
):
    """
    Get list of ERP reports
    
    Note: This endpoint will be fully implemented when the Report model is created.
    
    Requires ERP_VIEW_REPORTS permission.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Report model not yet implemented. This endpoint will be available once Report model is created.",
    )

