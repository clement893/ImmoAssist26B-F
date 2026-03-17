"""
ERP Portal - Orders Endpoints
Placeholder for when Order model is implemented
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/erp/orders", tags=["ERP Portal - Orders"])


@router.get("/")
@require_permission(Permission.ERP_VIEW_ALL_ORDERS)
async def get_erp_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
):
    """
    Get list of all orders (for ERP employees)
    
    Note: This endpoint will be fully implemented when the Order model is created.
    Currently returns empty list as placeholder.
    
    Requires ERP_VIEW_ALL_ORDERS permission.
    """
    # Placeholder - will be implemented when Order model exists
    return {
        "items": [],
        "total": 0,
        "page": 1,
        "page_size": 100,
        "total_pages": 0,
    }


@router.get("/{order_id}")
@require_permission(Permission.ERP_VIEW_ALL_ORDERS)
async def get_erp_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific order (for ERP employees)
    
    Note: This endpoint will be fully implemented when the Order model is created.
    
    Requires ERP_VIEW_ALL_ORDERS permission.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Order model not yet implemented. This endpoint will be available once Order model is created.",
    )

