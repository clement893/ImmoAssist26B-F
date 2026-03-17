"""
Portail Transaction Schemas (Portail client ImmoAssist)
Pydantic schemas for portal transactions
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class PortailTransactionBase(BaseModel):
    """Base portail transaction schema"""
    client_invitation_id: int
    type: str = Field(..., description="achat, vente, location")
    adresse: Optional[str] = None
    ville: Optional[str] = None
    prix_offert: Optional[Decimal] = None
    prix_accepte: Optional[Decimal] = None


class PortailTransactionCreate(BaseModel):
    """Schema for creating a portail transaction"""
    client_invitation_id: int
    type: str = Field(..., description="achat, vente, location")


class PortailTransactionUpdate(BaseModel):
    """Schema for updating a portail transaction"""
    progression: Optional[int] = Field(None, ge=0, le=100)
    statut: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    prix_offert: Optional[Decimal] = None
    prix_accepte: Optional[Decimal] = None
    date_fin: Optional[datetime] = None


class PortailTransactionResponse(BaseModel):
    """Schema for portail transaction response"""
    id: int
    client_invitation_id: int
    courtier_id: int
    type: str
    statut: str
    progression: int
    date_debut: datetime
    date_fin: Optional[datetime] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    prix_offert: Optional[Decimal] = None
    prix_accepte: Optional[Decimal] = None

    model_config = {"from_attributes": True}


class PortailTransactionDetail(PortailTransactionResponse):
    """Schema for portail transaction with relations (for client dashboard)"""
    pass
