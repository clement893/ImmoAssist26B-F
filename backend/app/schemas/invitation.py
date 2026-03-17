"""
Invitation Schemas
Pydantic schemas for invitations
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class InvitationBase(BaseModel):
    """Base invitation schema"""
    email: EmailStr = Field(..., description="Email address to invite")
    team_id: Optional[int] = Field(None, description="Team ID (if team invitation)")
    role_id: Optional[int] = Field(None, description="Role ID to assign")
    message: Optional[str] = Field(None, description="Custom invitation message")
    expires_in_days: int = Field(7, ge=1, le=30, description="Days until expiration")


class InvitationCreate(InvitationBase):
    """Schema for creating an invitation"""
    pass


class InvitationResponse(InvitationBase):
    """Schema for invitation response"""
    id: int
    token: str
    status: str  # pending, accepted, expired, cancelled
    invited_by_id: int
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    team: Optional[Dict[str, Any]] = None
    role: Optional[Dict[str, Any]] = None
    invited_by: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class InvitationAccept(BaseModel):
    """Schema for accepting an invitation"""
    token: str = Field(..., description="Invitation token")


class InvitationListResponse(BaseModel):
    """Schema for invitation list response"""
    invitations: List[InvitationResponse]
    total: int

