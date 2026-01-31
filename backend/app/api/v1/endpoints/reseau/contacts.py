"""
Réseau Contacts Endpoints
API endpoints for managing network module contacts

This module provides network-specific endpoints that reuse the commercial
contacts logic to avoid code duplication while maintaining isolation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.api.v1.endpoints.commercial import contacts as commercial_contacts
from app.schemas.contact import ContactCreate, ContactUpdate, Contact as ContactSchema

# Create a new router with réseau prefix
router = APIRouter(prefix="/reseau/contacts", tags=["reseau-contacts"])

# Reuse all endpoint functions from commercial contacts by creating wrapper endpoints
# This maintains isolation at the URL level while reusing the same logic

@router.get("/", response_model=List[ContactSchema])
async def list_contacts(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    circle: Optional[str] = Query(None),
    company_id: Optional[int] = Query(None),
):
    """Get list of contacts for network module"""
    return await commercial_contacts.list_contacts(
        request=request,
        db=db,
        current_user=current_user,
        skip=skip,
        limit=limit,
        circle=circle,
        company_id=company_id,
    )

@router.post("/", response_model=ContactSchema, status_code=201)
async def create_contact(
    request: Request,
    contact_data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new contact for network module"""
    return await commercial_contacts.create_contact(
        request=request,
        contact_data=contact_data,
        db=db,
        current_user=current_user,
    )

@router.delete("/bulk", status_code=200)
async def delete_all_contacts(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all contacts for network module"""
    return await commercial_contacts.delete_all_contacts(
        request=request,
        db=db,
        current_user=current_user,
    )

@router.get("/{contact_id}", response_model=ContactSchema)
async def get_contact(
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific contact by ID for network module"""
    return await commercial_contacts.get_contact(
        contact_id=contact_id,
        db=db,
        current_user=current_user,
    )

@router.put("/{contact_id}", response_model=ContactSchema)
async def update_contact(
    request: Request,
    contact_id: int,
    contact_data: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a contact for network module"""
    return await commercial_contacts.update_contact(
        request=request,
        contact_id=contact_id,
        contact_data=contact_data,
        db=db,
        current_user=current_user,
    )

@router.delete("/{contact_id}", status_code=204)
async def delete_contact(
    request: Request,
    contact_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a contact for network module"""
    return await commercial_contacts.delete_contact(
        request=request,
        contact_id=contact_id,
        db=db,
        current_user=current_user,
    )

@router.post("/import")
async def import_contacts(
    file: UploadFile = File(...),
    import_id: Optional[str] = Query(None, description="Optional import ID for tracking logs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import contacts from Excel or ZIP for network module"""
    return await commercial_contacts.import_contacts(
        file=file,
        import_id=import_id,
        db=db,
        current_user=current_user,
    )

@router.get("/export")
async def export_contacts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export contacts to Excel for network module"""
    return await commercial_contacts.export_contacts(
        db=db,
        current_user=current_user,
    )

@router.get("/import/{import_id}/logs")
async def stream_import_logs(
    import_id: str,
    current_user: User = Depends(get_current_user),
):
    """Stream import logs via Server-Sent Events (SSE) for network module"""
    return await commercial_contacts.stream_import_logs(
        import_id=import_id,
        current_user=current_user,
    )
