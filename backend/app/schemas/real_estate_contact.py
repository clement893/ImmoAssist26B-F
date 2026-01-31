"""
Real Estate Contact Schemas
Pydantic v2 models for real estate contacts
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator, EmailStr
from app.models.real_estate_contact import ContactType


class RealEstateContactBase(BaseModel):
    """Base contact schema"""
    first_name: str = Field(..., min_length=1, max_length=100, description="Prénom", strip_whitespace=True)
    last_name: str = Field(..., min_length=1, max_length=100, description="Nom de famille", strip_whitespace=True)
    email: Optional[EmailStr] = Field(None, description="Adresse email")
    phone: Optional[str] = Field(None, max_length=50, description="Numéro de téléphone")
    company: Optional[str] = Field(None, max_length=200, description="Entreprise ou agence")
    type: ContactType = Field(..., description="Type de contact")
    user_id: Optional[int] = Field(None, description="ID de l'utilisateur lié (optionnel)")
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name fields"""
        if not v or not v.strip():
            raise ValueError("Le nom ne peut pas être vide")
        return v.strip()
    
    model_config = ConfigDict(from_attributes=True)


class RealEstateContactCreate(RealEstateContactBase):
    """Schema for creating a new contact"""
    pass


class RealEstateContactUpdate(BaseModel):
    """Schema for updating a contact"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Prénom", strip_whitespace=True)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Nom de famille", strip_whitespace=True)
    email: Optional[EmailStr] = Field(None, description="Adresse email")
    phone: Optional[str] = Field(None, max_length=50, description="Numéro de téléphone")
    company: Optional[str] = Field(None, max_length=200, description="Entreprise ou agence")
    type: Optional[ContactType] = Field(None, description="Type de contact")
    
    model_config = ConfigDict(from_attributes=True)


class RealEstateContactResponse(RealEstateContactBase):
    """Schema for contact response"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class RealEstateContactListResponse(BaseModel):
    """Schema for contact list response"""
    contacts: List[RealEstateContactResponse]
    total: int
    skip: int
    limit: int
    
    model_config = ConfigDict(from_attributes=True)


# Transaction Contact Schemas
class TransactionContactCreate(BaseModel):
    """Schema for associating a contact to a transaction"""
    contact_id: int = Field(..., description="ID du contact existant")
    role: str = Field(..., min_length=1, max_length=100, description="Rôle du contact dans la transaction")
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate role field"""
        if not v or not v.strip():
            raise ValueError("Le rôle ne peut pas être vide")
        return v.strip()
    
    model_config = ConfigDict(from_attributes=True)


class TransactionContactResponse(BaseModel):
    """Schema for transaction contact response"""
    transaction_id: int
    contact_id: int
    role: str
    created_at: datetime
    contact: RealEstateContactResponse
    
    model_config = ConfigDict(from_attributes=True)


class TransactionContactListResponse(BaseModel):
    """Schema for transaction contact list response"""
    contacts: List[TransactionContactResponse]
    total: int
    
    model_config = ConfigDict(from_attributes=True)
