"""
ERP Portal - Inventory Endpoints
Placeholder for when Inventory model is implemented
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/erp/inventory", tags=["ERP Portal - Inventory"])


@router.get("/products")
@require_permission(Permission.ERP_VIEW_INVENTORY)
async def get_inventory_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    low_stock_only: bool = Query(False, description="Filter only low stock items"),
):
    """
    Get list of inventory products
    
    Note: This endpoint will be fully implemented when the Product/Inventory model is created.
    
    Requires ERP_VIEW_INVENTORY permission.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Inventory model not yet implemented. This endpoint will be available once Product/Inventory model is created.",
    )


@router.get("/movements")
@require_permission(Permission.INVENTORY_VIEW_STOCK)
async def get_inventory_movements(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    product_id: Optional[int] = Query(None),
    movement_type: Optional[str] = Query(None),
):
    """
    Get inventory movements
    
    Note: This endpoint will be fully implemented when the InventoryMovement model is created.
    
    Requires INVENTORY_VIEW_STOCK permission.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Inventory movement model not yet implemented. This endpoint will be available once InventoryMovement model is created.",
    )

