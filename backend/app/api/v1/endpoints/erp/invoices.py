"""
ERP Portal - Invoices Endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.schemas.erp import (
    ERPInvoiceResponse,
    ERPInvoiceListResponse,
)
from app.services.erp_service import ERPService
from app.utils.invoice_helpers import convert_invoice_to_erp_response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/erp/invoices", tags=["ERP Portal - Invoices"])


@router.get("/", response_model=ERPInvoiceListResponse)
@require_permission(Permission.ERP_VIEW_INVOICES)
async def get_erp_invoices(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
) -> ERPInvoiceListResponse:
    """
    Get list of all invoices (for ERP employees)
    
    Returns all invoices in the system, optionally filtered by status or client.
    Requires ERP_VIEW_INVOICES permission.
    """
    service = ERPService(db)
    invoices, total = await service.get_all_invoices(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
        client_id=client_id,
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    page = (skip // limit) + 1 if limit > 0 else 1
    
    # Convert to ERP response format
    # Note: User relationship is already loaded via selectinload in ERPService
    invoice_items = [
        ERPInvoiceResponse.model_validate(convert_invoice_to_erp_response(invoice))
        for invoice in invoices
    ]
    
    return ERPInvoiceListResponse(
        items=invoice_items,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/{invoice_id}", response_model=ERPInvoiceResponse)
@require_permission(Permission.ERP_VIEW_INVOICES)
async def get_erp_invoice(
    invoice_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ERPInvoiceResponse:
    """
    Get a specific invoice (for ERP employees)
    
    Returns invoice details. Requires ERP_VIEW_INVOICES permission.
    """
    service = ERPService(db)
    invoice = await service.get_invoice(invoice_id=invoice_id)
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )
    
    # Load user relationship if not already loaded
    if not hasattr(invoice, 'user') or invoice.user is None:
        invoice_query = select(Invoice).where(Invoice.id == invoice.id).options(selectinload(Invoice.user))
        invoice_result = await db.execute(invoice_query)
        invoice = invoice_result.scalar_one()
    
    # Convert to ERP response format
    return ERPInvoiceResponse.model_validate(convert_invoice_to_erp_response(invoice))

