"""
Transaction Tache Schemas (Portail client ImmoAssist)
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TransactionTacheCreate(BaseModel):
    """Schema for creating a transaction task"""
    transaction_id: int
    titre: str
    description: Optional[str] = None
    priorite: str = Field(..., description="haute, moyenne, basse")
    categorie: str
    echeance: datetime


class TransactionTacheUpdate(BaseModel):
    """Schema for updating a transaction task"""
    titre: Optional[str] = None
    description: Optional[str] = None
    priorite: Optional[str] = None
    echeance: Optional[datetime] = None
    completee: Optional[bool] = None


class TransactionTacheResponse(BaseModel):
    """Schema for transaction task response"""
    id: int
    transaction_id: int
    titre: str
    description: Optional[str] = None
    priorite: str
    categorie: str
    echeance: datetime
    completee: bool
    date_completion: Optional[datetime] = None
    cree_par_id: int
    date_creation: datetime

    model_config = {"from_attributes": True}
