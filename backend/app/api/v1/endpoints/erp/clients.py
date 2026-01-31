"""
ERP Portal - Clients Endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.erp import (
    ERPClientResponse,
    ERPClientListResponse,
)
from app.services.erp_service import ERPService

router = APIRouter(prefix="/erp/clients", tags=["ERP Portal - Clients"])


@router.get("/", response_model=ERPClientListResponse)
@require_permission(Permission.ERP_VIEW_CLIENTS)
async def get_erp_clients(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
) -> ERPClientListResponse:
    """
    Get list of all clients (for ERP employees)
    
    Returns all clients in the system, optionally filtered by active status.
    Requires ERP_VIEW_CLIENTS permission.
    """
    service = ERPService(db)
    clients, total = await service.get_all_clients(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        is_active=is_active,
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    page = (skip // limit) + 1 if limit > 0 else 1
    
    # Convert to ERP response format
    client_items = []
    for client in clients:
        # Calculate client stats (simplified - would need proper queries)
        client_dict = {
            **client.__dict__,
            "name": f"{client.first_name or ''} {client.last_name or ''}".strip() or client.email,
            "company_name": None,  # Would come from Client model if it exists
            "total_orders": 0,  # Would calculate from Order model
            "total_spent": 0,  # Would calculate from Invoice model
        }
        client_items.append(ERPClientResponse.model_validate(client_dict))
    
    return ERPClientListResponse(
        items=client_items,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/{client_id}", response_model=ERPClientResponse)
@require_permission(Permission.ERP_VIEW_CLIENTS)
async def get_erp_client(
    client_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ERPClientResponse:
    """
    Get a specific client (for ERP employees)
    
    Returns client details. Requires ERP_VIEW_CLIENTS permission.
    """
    service = ERPService(db)
    client = await service.get_client(client_id=client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    
    # Convert to ERP response format
    client_dict = {
        **client.__dict__,
        "name": f"{client.first_name or ''} {client.last_name or ''}".strip() or client.email,
        "company_name": None,
        "total_orders": 0,
        "total_spent": 0,
    }
    
    return ERPClientResponse.model_validate(client_dict)

