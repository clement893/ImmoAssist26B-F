"""
Team Schemas
Pydantic schemas for teams
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class TeamBase(BaseModel):
    """Base team schema"""
    name: str = Field(..., min_length=1, max_length=200, description="Team name")
    slug: str = Field(..., min_length=1, max_length=200, description="URL-friendly identifier")
    description: Optional[str] = Field(None, description="Team description")
    settings: Optional[Dict[str, Any]] = Field(None, description="Team settings (JSON)")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug format"""
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Slug must contain only alphanumeric characters, hyphens, and underscores")
        return v.lower()


class TeamCreate(TeamBase):
    """Schema for creating a team"""
    pass


class TeamUpdate(BaseModel):
    """Schema for updating a team"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class TeamMemberBase(BaseModel):
    """Base team member schema"""
    role_id: int = Field(..., description="Role ID for the member")


class TeamMemberAdd(TeamMemberBase):
    """Schema for adding a team member"""
    user_id: int = Field(..., description="User ID to add")


class TeamMemberUpdate(BaseModel):
    """Schema for updating a team member"""
    role_id: int = Field(..., description="New role ID")


class TeamMemberResponse(BaseModel):
    """Schema for team member response"""
    id: int
    team_id: int
    user_id: int
    role_id: int
    is_active: bool
    joined_at: datetime
    updated_at: datetime
    user: Optional[Dict[str, Any]] = None  # User info
    role: Optional[Dict[str, Any]] = None  # Role info

    model_config = {"from_attributes": True}


class TeamResponse(TeamBase):
    """Schema for team response"""
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    members: List[TeamMemberResponse] = []
    owner: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class TeamListResponse(BaseModel):
    """Schema for team list response"""
    teams: List[TeamResponse]
    total: int

