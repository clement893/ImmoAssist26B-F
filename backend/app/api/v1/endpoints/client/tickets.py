"""
Client Portal - Support Tickets Endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.client import (
    ClientTicketResponse,
    ClientTicketCreate,
    ClientTicketListResponse,
)
from app.services.client_service import ClientService

router = APIRouter(prefix="/client/tickets", tags=["Client Portal - Support Tickets"])


@router.get("/", response_model=ClientTicketListResponse)
@require_permission(Permission.CLIENT_VIEW_TICKETS)
async def get_client_tickets(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
) -> ClientTicketListResponse:
    """
    Get list of support tickets for the current client
    
    Returns only tickets belonging to the authenticated client user.
    """
    service = ClientService(db)
    tickets, total = await service.get_client_tickets(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ClientTicketListResponse(
        items=[ClientTicketResponse.model_validate(ticket) for ticket in tickets],
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/{ticket_id}", response_model=ClientTicketResponse)
@require_permission(Permission.CLIENT_VIEW_TICKETS)
async def get_client_ticket(
    ticket_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ClientTicketResponse:
    """
    Get a specific support ticket for the current client
    
    Returns 404 if ticket doesn't exist or doesn't belong to the client.
    """
    service = ClientService(db)
    ticket = await service.get_client_ticket(
        user_id=current_user.id,
        ticket_id=ticket_id,
    )
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )
    
    return ClientTicketResponse.model_validate(ticket)


@router.post("/", response_model=ClientTicketResponse, status_code=status.HTTP_201_CREATED)
@require_permission(Permission.CLIENT_SUBMIT_TICKETS)
async def create_client_ticket(
    ticket_data: ClientTicketCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ClientTicketResponse:
    """
    Create a new support ticket for the current client
    """
    service = ClientService(db)
    ticket = await service.create_client_ticket(
        user_id=current_user.id,
        subject=ticket_data.subject,
        description=ticket_data.description,
        priority=ticket_data.priority,
        category=ticket_data.category,
    )
    
    # Get first message as description
    from app.models.support_ticket import TicketMessage
    from sqlalchemy import select
    
    message_query = select(TicketMessage).where(
        TicketMessage.ticket_id == ticket.id
    ).order_by(TicketMessage.created_at.asc()).limit(1)
    message_result = await db.execute(message_query)
    first_message = message_result.scalar_one_or_none()
    
    ticket_dict = {
        **ticket.__dict__,
        "description": first_message.message if first_message else None,
    }
    
    return ClientTicketResponse.model_validate(ticket_dict)

