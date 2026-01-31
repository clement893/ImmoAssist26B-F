"""
Invitations Endpoints
API endpoints for team/user invitations
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.dependencies.rbac import require_team_permission, require_team_member
from app.models import User
from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    InvitationAccept,
    InvitationListResponse,
)
from app.services.invitation_service import InvitationService

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.post("", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invitation_data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invitation"""
    invitation_service = InvitationService(db)
    
    # If team invitation, check permissions
    if invitation_data.team_id:
        await require_team_permission(invitation_data.team_id, "teams:invitations:create", current_user, db)
    
    # Check if user already exists
    from app.models import User as UserModel
    from sqlalchemy import select
    
    result = await db.execute(
        select(UserModel).where(UserModel.email == invitation_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user and invitation_data.team_id:
        # Check if already a team member
        from app.services.team_service import TeamService
        team_service = TeamService(db)
        if await team_service.is_team_member(existing_user.id, invitation_data.team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a team member",
            )
    
    invitation = await invitation_service.create_invitation(
        email=invitation_data.email,
        invited_by_id=current_user.id,
        team_id=invitation_data.team_id,
        role_id=invitation_data.role_id,
        message=invitation_data.message,
        expires_in_days=invitation_data.expires_in_days,
    )
    
    return InvitationResponse.model_validate(invitation)


@router.get("", response_model=InvitationListResponse)
async def list_invitations(
    team_id: int = Query(None, description="Filter by team ID"),
    status_filter: str = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List invitations"""
    invitation_service = InvitationService(db)
    
    if team_id:
        await require_team_member(team_id, current_user, db)
        invitations = await invitation_service.get_team_invitations(team_id)
    else:
        # List user's sent invitations
        from app.models import Invitation
        from sqlalchemy import select
        
        query = select(Invitation).where(Invitation.invited_by_id == current_user.id)
        if status_filter:
            query = query.where(Invitation.status == status_filter)
        
        result = await db.execute(query.order_by(Invitation.created_at.desc()))
        invitations = list(result.scalars().all())
    
    return InvitationListResponse(
        invitations=[InvitationResponse.model_validate(i) for i in invitations],
        total=len(invitations),
    )


@router.get("/{invitation_id}", response_model=InvitationResponse)
async def get_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get an invitation by ID"""
    from app.models import Invitation
    from sqlalchemy import select
    
    result = await db.execute(
        select(Invitation)
        .where(Invitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    # Check access: user must be the inviter or the invitee
    if invitation.invited_by_id != current_user.id and invitation.email != current_user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return InvitationResponse.model_validate(invitation)


@router.post("/accept", response_model=InvitationResponse)
async def accept_invitation(
    accept_data: InvitationAccept,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept an invitation"""
    invitation_service = InvitationService(db)
    
    invitation = await invitation_service.accept_invitation(
        token=accept_data.token,
        user_id=current_user.id,
    )
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation",
        )
    
    return InvitationResponse.model_validate(invitation)


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel an invitation"""
    from app.models import Invitation
    from sqlalchemy import select
    
    result = await db.execute(
        select(Invitation).where(Invitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    # Check permissions
    if invitation.invited_by_id != current_user.id:
        if invitation.team_id:
            await require_team_permission(invitation.team_id, "teams:invitations:cancel", current_user, db)
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    invitation_service = InvitationService(db)
    success = await invitation_service.cancel_invitation(invitation_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel this invitation",
        )
    
    return None


@router.post("/{invitation_id}/resend", response_model=InvitationResponse)
async def resend_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resend an invitation email"""
    from app.models import Invitation
    from sqlalchemy import select
    
    result = await db.execute(
        select(Invitation).where(Invitation.id == invitation_id)
    )
    invitation = result.scalar_one_or_none()
    
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    # Check permissions
    if invitation.invited_by_id != current_user.id:
        if invitation.team_id:
            await require_team_permission(invitation.team_id, "teams:invitations:resend", current_user, db)
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    invitation_service = InvitationService(db)
    invitation = await invitation_service.resend_invitation(invitation_id)
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot resend this invitation",
        )
    
    return InvitationResponse.model_validate(invitation)


@router.get("/token/{token}", response_model=InvitationResponse)
async def get_invitation_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """Get an invitation by token (public endpoint for accepting)"""
    invitation_service = InvitationService(db)
    invitation = await invitation_service.get_invitation(token)
    
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    if not invitation.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation is expired or already used",
        )
    
    return InvitationResponse.model_validate(invitation)

