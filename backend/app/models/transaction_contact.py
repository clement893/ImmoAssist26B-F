"""
Transaction Contact Model
Table de liaison entre transactions et contacts avec rôles
"""

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TransactionContact(Base):
    """Association table between transactions and contacts with roles"""
    __tablename__ = "transaction_contacts"
    __table_args__ = (
        Index("idx_transaction_contacts_transaction", "transaction_id"),
        Index("idx_transaction_contacts_contact", "contact_id"),
        Index("idx_transaction_contacts_role", "role"),
        Index("idx_transaction_contacts_composite", "transaction_id", "contact_id", "role"),
    )

    transaction_id = Column(
        Integer, 
        ForeignKey("real_estate_transactions.id", ondelete="CASCADE"), 
        primary_key=True,
        comment="ID de la transaction"
    )
    contact_id = Column(
        Integer, 
        ForeignKey("real_estate_contacts.id", ondelete="CASCADE"), 
        primary_key=True,
        comment="ID du contact"
    )
    role = Column(
        String(100), 
        primary_key=True,
        comment="Rôle du contact dans cette transaction (ex: 'Vendeur', 'Acheteur', 'Notaire instrumentant')"
    )
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    transaction = relationship("RealEstateTransaction", back_populates="transaction_contacts")
    contact = relationship("RealEstateContact", back_populates="transaction_roles")
    
    def __repr__(self) -> str:
        return f"<TransactionContact(transaction_id={self.transaction_id}, contact_id={self.contact_id}, role={self.role})>"
