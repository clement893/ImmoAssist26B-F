"""
Support Tickets API Endpoints
Customer support tickets management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import re
import os

from app.models.support_ticket import SupportTicket, TicketMessage, TicketStatus, TicketPriority
from app.models.user import User
from app.dependencies import get_current_user, get_db, is_superadmin, is_admin_or_superadmin
from app.core.security_audit import SecurityAuditLogger
from app.services.email_service import EmailService
from app.core.config import settings

router = APIRouter()
security = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Get optional authenticated user - returns None if not authenticated"""
    if not credentials:
        return None
    
    try:
        from jose import jwt, JWTError
        from app.schemas.auth import TokenData
        
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_type = payload.get("type")
        if token_type != "access":
            return None
        
        username: str = payload.get("sub")
        if not username:
            return None
        
        token_data = TokenData(username=username)
        result = await db.execute(select(User).where(User.email == token_data.username))
        user = result.scalar_one_or_none()
        return user if user and user.is_active else None
    except JWTError:
        # Invalid or expired token
        return None
    except Exception:
        # Any other error - return None (user not authenticated)
        return None


async def get_or_create_user_by_email(email: str, db: AsyncSession) -> User:
    """Get existing user by email or create a guest user"""
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    
    if user:
        return user
    
    # Create a guest user (inactive, with a random password hash)
    from app.api.v1.endpoints.auth import get_password_hash
    import secrets
    
    # Generate a random password that will never be used (guest users can't login)
    random_password = secrets.token_urlsafe(32)
    email_prefix = email.split('@')[0]
    
    guest_user = User(
        email=email.lower(),
        hashed_password=get_password_hash(random_password),
        first_name=email_prefix,  # Use email prefix as first name
        is_active=False,  # Guest users are inactive (can't login)
    )
    db.add(guest_user)
    await db.flush()
    return guest_user


class TicketMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)


class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    message: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    is_staff: bool
    created_at: str

    class Config:
        from_attributes = True


class SupportTicketCreate(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    subject: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., pattern='^(technical|billing|feature|general|bug)$')
    priority: str = Field(default='medium', pattern='^(low|medium|high|urgent)$')
    message: str = Field(..., min_length=1)


class SupportTicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, pattern='^(technical|billing|feature|general|bug)$')
    status: Optional[str] = Field(None, pattern='^(open|in_progress|resolved|closed)$')
    priority: Optional[str] = Field(None, pattern='^(low|medium|high|urgent)$')


class SupportTicketResponse(BaseModel):
    id: int
    subject: str
    category: str
    status: str
    priority: str
    user_id: int
    created_at: str
    updated_at: str
    last_reply_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/support/tickets", response_model=List[SupportTicketResponse], tags=["support"])
async def list_tickets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List support tickets"""
    query = select(SupportTicket).where(SupportTicket.user_id == current_user.id)
    
    if status:
        query = query.where(SupportTicket.status == status)
    if category:
        query = query.where(SupportTicket.category == category)
    
    result = await db.execute(query.order_by(SupportTicket.created_at.desc()))
    tickets = result.scalars().all()
    return [SupportTicketResponse.model_validate(ticket) for ticket in tickets]


@router.get("/support/tickets/{ticket_id}", response_model=SupportTicketResponse, tags=["support"])
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a ticket by ID"""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    return SupportTicketResponse.model_validate(ticket)


@router.get("/support/tickets/{ticket_id}/messages", response_model=List[TicketMessageResponse], tags=["support"])
async def get_ticket_messages(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a ticket"""
    # Verify ticket exists and user has access
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    if ticket.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this ticket"
        )
    
    result = await db.execute(
        select(TicketMessage)
        .where(TicketMessage.ticket_id == ticket_id)
        .order_by(TicketMessage.created_at.asc())
    )
    messages = result.scalars().all()
    
    responses = []
    for msg in messages:
        response = TicketMessageResponse.model_validate(msg)
        if msg.user:
            # Combine first_name and last_name if available
            name_parts = [part for part in [msg.user.first_name, msg.user.last_name] if part]
            response.user_name = ' '.join(name_parts) if name_parts else msg.user.email
            response.user_email = msg.user.email
        responses.append(response)
    
    return responses


@router.post("/support/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED, tags=["support"])
async def create_ticket(
    ticket_data: SupportTicketCreate,
    request: Optional[object] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new support ticket (supports both authenticated and unauthenticated users)"""
    # If user is authenticated, use their account; otherwise, get or create user by email
    if current_user:
        user = current_user
        # Verify email matches if authenticated
        if current_user.email.lower() != ticket_data.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email does not match authenticated user"
            )
    else:
        # Get or create user by email for unauthenticated submissions
        user = await get_or_create_user_by_email(ticket_data.email, db)
    
    ticket = SupportTicket(
        subject=ticket_data.subject,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status=TicketStatus.OPEN.value,
        user_id=user.id,
    )
    
    db.add(ticket)
    await db.flush()  # Get ticket ID
    
    # Create initial message
    message = TicketMessage(
        ticket_id=ticket.id,
        message=ticket_data.message,
        user_id=user.id,
        is_staff=False,
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(ticket)
    
    # Log audit event
    try:
        SecurityAuditLogger.log_event(
            user_id=user.id,
            event_type="support_ticket_created",
            severity="info",
            message=f"Support ticket '{ticket.subject}' created",
        )
    except Exception:
        pass  # Don't fail if audit logging fails
    
    # Send emails via SendGrid
    try:
        email_service = EmailService()
        if email_service.is_configured():
            # Get support email from environment or use default
            support_email = os.getenv("SUPPORT_EMAIL", settings.SENDGRID_FROM_EMAIL)
            
            # Escape HTML to prevent XSS
            def escape_html(text: str) -> str:
                return (text
                    .replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace('"', "&quot;")
                    .replace("'", "&#x27;"))
            
            # Format message with proper line breaks
            formatted_message = escape_html(ticket_data.message).replace('\n', '<br>')
            escaped_subject = escape_html(ticket_data.subject)
            escaped_email = escape_html(ticket_data.email)
            
            # Email to support team
            support_subject = f"[{ticket_data.category.upper()}] Support Ticket #{ticket.id}: {escaped_subject}"
            support_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>New Support Ticket</h2>
                <p><strong>Ticket ID:</strong> #{ticket.id}</p>
                <p><strong>From:</strong> {escaped_email}</p>
                <p><strong>Category:</strong> {ticket_data.category}</p>
                <p><strong>Priority:</strong> {ticket_data.priority}</p>
                <p><strong>Subject:</strong> {escaped_subject}</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>{formatted_message}</p>
            </body>
            </html>
            """
            email_service.send_email(
                to_email=support_email,
                subject=support_subject,
                html_content=support_html,
                reply_to=ticket_data.email,
            )
            
            # Confirmation email to user
            confirmation_subject = f"Support Ticket #{ticket.id} Received"
            confirmation_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Thank You for Contacting Us</h2>
                <p>We have received your support ticket and will get back to you soon.</p>
                <p><strong>Ticket ID:</strong> #{ticket.id}</p>
                <p><strong>Subject:</strong> {escaped_subject}</p>
                <p><strong>Category:</strong> {ticket_data.category}</p>
                <p><strong>Priority:</strong> {ticket_data.priority}</p>
                <hr>
                <p><strong>Your Message:</strong></p>
                <p>{formatted_message}</p>
                <hr>
                <p>We typically respond within 24 hours. You will receive an email notification when we reply.</p>
            </body>
            </html>
            """
            email_service.send_email(
                to_email=ticket_data.email,
                subject=confirmation_subject,
                html_content=confirmation_html,
            )
    except Exception as e:
        # Log error but don't fail the request if email sending fails
        from app.core.logging import logger
        logger.error(f"Failed to send support ticket emails: {e}", exc_info=True)
    
    return SupportTicketResponse.model_validate(ticket)


@router.post("/support/tickets/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=status.HTTP_201_CREATED, tags=["support"])
async def add_ticket_message(
    ticket_id: int,
    message_data: TicketMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a message to a ticket"""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add messages to this ticket"
        )
    
    is_staff_user = await is_admin_or_superadmin(current_user, db)
    message = TicketMessage(
        ticket_id=ticket_id,
        message=message_data.message,
        user_id=current_user.id,
        is_staff=is_staff_user,
    )
    
    # Update ticket last_reply_at
    from datetime import datetime
    ticket.last_reply_at = datetime.utcnow()
    if ticket.status == TicketStatus.RESOLVED.value:
        ticket.status = TicketStatus.IN_PROGRESS.value
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    response = TicketMessageResponse.model_validate(message)
    if message.user:
        # Combine first_name and last_name if available
        name_parts = [part for part in [message.user.first_name, message.user.last_name] if part]
        response.user_name = ' '.join(name_parts) if name_parts else message.user.email
        response.user_email = message.user.email
    
    return response


@router.put("/support/tickets/{ticket_id}", response_model=SupportTicketResponse, tags=["support"])
async def update_ticket(
    ticket_id: int,
    ticket_data: SupportTicketUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a ticket"""
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    
    # Check ownership or admin
    if ticket.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this ticket"
        )
    
    if ticket_data.subject is not None:
        ticket.subject = ticket_data.subject
    if ticket_data.category is not None:
        ticket.category = ticket_data.category
    if ticket_data.status is not None:
        ticket.status = ticket_data.status
    if ticket_data.priority is not None:
        ticket.priority = ticket_data.priority
    
    await db.commit()
    await db.refresh(ticket)
    
    return SupportTicketResponse.model_validate(ticket)

