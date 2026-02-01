"""
Transaction Document Schemas (Portail client ImmoAssist)
"""

from datetime import datetime
from pydantic import BaseModel, Field


class TransactionDocumentCreate(BaseModel):
    """Schema for creating/uploading a transaction document"""
    transaction_id: int
    nom: str
    type: str  # pdf, image, excel, word
    categorie: str
    taille: str
    url: str


class TransactionDocumentResponse(BaseModel):
    """Schema for transaction document response"""
    id: int
    transaction_id: int
    nom: str
    type: str
    categorie: str
    taille: str | None
    url: str
    partage_par_id: int
    date_partage: datetime
    nouveau: bool

    model_config = {"from_attributes": True}
