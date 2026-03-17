"""
Client Portal - Invoices Endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.client import (
    ClientInvoiceResponse,
    ClientInvoiceListResponse,
)
from app.services.client_service import ClientService

router = APIRouter(prefix="/client/invoices", tags=["Client Portal - Invoices"])


@router.get("/", response_model=ClientInvoiceListResponse)
@require_permission(Permission.CLIENT_VIEW_INVOICES)
async def get_client_invoices(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
) -> ClientInvoiceListResponse:
    """
    Get list of invoices for the current client
    
    Returns only invoices belonging to the authenticated client user.
    """
    service = ClientService(db)
    invoices, total = await service.get_client_invoices(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ClientInvoiceListResponse(
        items=[ClientInvoiceResponse.model_validate(invoice) for invoice in invoices],
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/{invoice_id}", response_model=ClientInvoiceResponse)
@require_permission(Permission.CLIENT_VIEW_INVOICES)
async def get_client_invoice(
    invoice_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ClientInvoiceResponse:
    """
    Get a specific invoice for the current client
    
    Returns 404 if invoice doesn't exist or doesn't belong to the client.
    """
    service = ClientService(db)
    invoice = await service.get_client_invoice(
        user_id=current_user.id,
        invoice_id=invoice_id,
    )
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    return ClientInvoiceResponse.model_validate(invoice)

