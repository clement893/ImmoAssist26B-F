"""
Real Estate Contact Model
Modèle pour les contacts des transactions immobilières
"""

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ContactType(str, enum.Enum):
    """Type de contact pour les transactions immobilières"""
    CLIENT = "client"
    REAL_ESTATE_BROKER = "real_estate_broker"
    MORTGAGE_BROKER = "mortgage_broker"
    NOTARY = "notary"
    INSPECTOR = "inspector"
    CONTRACTOR = "contractor"
    INSURANCE_BROKER = "insurance_broker"
    OTHER = "other"


class RealEstateContact(Base):
    """Contact model for real estate transactions"""
    __tablename__ = "real_estate_contacts"
    __table_args__ = (
        Index("idx_real_estate_contacts_email", "email"),
        Index("idx_real_estate_contacts_type", "type"),
        Index("idx_real_estate_contacts_user_id", "user_id"),
        Index("idx_real_estate_contacts_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False, index=True, comment="Prénom")
    last_name = Column(String(100), nullable=False, index=True, comment="Nom de famille")
    email = Column(String(255), nullable=True, unique=True, index=True, comment="Adresse email")
    phone = Column(String(50), nullable=True, comment="Numéro de téléphone")
    company = Column(String(200), nullable=True, comment="Entreprise ou agence")
    type = Column(SQLEnum(ContactType), nullable=False, index=True, comment="Type de contact")
    
    # Lien optionnel avec User (plusieurs contacts par utilisateur)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", backref="real_estate_contact")
    transaction_roles = relationship("TransactionContact", back_populates="contact", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<RealEstateContact(id={self.id}, name={self.first_name} {self.last_name}, type={self.type})>"
    
    @property
    def full_name(self) -> str:
        """Retourne le nom complet"""
        return f"{self.first_name} {self.last_name}".strip()
