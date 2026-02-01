"""
Client Invitation Schemas (Portail client ImmoAssist)
Pydantic schemas for broker-to-client invitations
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class ClientInvitationBase(BaseModel):
    """Base client invitation schema"""
    prenom: str = Field(..., min_length=1, max_length=100)
    nom: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    telephone: Optional[str] = Field(None, max_length=50)
    type_projet: str = Field(..., description="achat, vente, location")
    message_personnalise: Optional[str] = None
    acces_documents: bool = True
    acces_messagerie: bool = True
    acces_taches: bool = True
    acces_calendrier: bool = True
    acces_proprietes: bool = True


class ClientInvitationCreate(ClientInvitationBase):
    """Schema for creating a client invitation"""
    pass


class ClientInvitationUpdate(BaseModel):
    """Schema for updating a client invitation"""
    statut: Optional[str] = None
    acces_documents: Optional[bool] = None
    acces_messagerie: Optional[bool] = None
    acces_taches: Optional[bool] = None
    acces_calendrier: Optional[bool] = None
    acces_proprietes: Optional[bool] = None


class ClientInvitationResponse(ClientInvitationBase):
    """Schema for client invitation response"""
    id: int
    courtier_id: int
    statut: str
    token: str
    date_invitation: datetime
    date_activation: Optional[datetime] = None
    derniere_connexion: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClientInvitationList(BaseModel):
    """Schema for listing client invitations (summary)"""
    id: int
    prenom: str
    nom: str
    email: str
    telephone: Optional[str] = None
    type_projet: str
    statut: str
    date_invitation: datetime
    derniere_connexion: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClientInvitationActivate(BaseModel):
    """Schema for activating invitation (create user)"""
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = None  # defaults to prenom from invitation
    last_name: Optional[str] = None  # defaults to nom from invitation
