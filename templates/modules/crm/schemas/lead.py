"""
CRM Lead Schemas
Schemas Pydantic pour les leads
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from templates.modules.crm.models.lead import LeadStatus


class LeadBase(BaseModel):
    """Schema de base pour Lead"""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    job_title: Optional[str] = Field(None, max_length=100)
    status: LeadStatus = LeadStatus.NEW
    source: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    """Schema pour création de Lead"""
    assigned_to_id: Optional[UUID] = None


class LeadUpdate(BaseModel):
    """Schema pour mise à jour de Lead"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=255)
    job_title: Optional[str] = Field(None, max_length=100)
    status: Optional[LeadStatus] = None
    source: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    assigned_to_id: Optional[UUID] = None


class LeadResponse(LeadBase):
    """Schema pour réponse Lead"""
    id: UUID
    assigned_to_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

