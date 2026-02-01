"""
Portail Transaction Model (Portail client ImmoAssist)
SQLAlchemy model for client-broker transactions in the portal
"""

from decimal import Decimal
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PortailTransaction(Base):
    """Transaction in the client portal (achat, vente, location)"""
    __tablename__ = "portail_transactions"
    __table_args__ = (
        Index("idx_portail_transactions_client_invitation_id", "client_invitation_id"),
        Index("idx_portail_transactions_courtier_id", "courtier_id"),
        Index("idx_portail_transactions_statut", "statut"),
    )

    id = Column(Integer, primary_key=True, index=True)
    client_invitation_id = Column(Integer, ForeignKey("client_invitations.id"), nullable=False, index=True)
    courtier_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # 'achat', 'vente', 'location'
    statut = Column(String(50), default="recherche", nullable=False)
    # recherche, offre, inspection, financement, notaire, complete
    progression = Column(Integer, default=0, nullable=False)  # 0-100
    date_debut = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_fin = Column(DateTime(timezone=True), nullable=True)

    # Property info
    adresse = Column(String(255), nullable=True)
    ville = Column(String(100), nullable=True)
    prix_offert = Column(Numeric(12, 2), nullable=True)
    prix_accepte = Column(Numeric(12, 2), nullable=True)

    # Relationships
    client_invitation = relationship("ClientInvitation", back_populates="transactions")
    courtier = relationship("User", back_populates="transactions_portail", foreign_keys=[courtier_id])
    documents = relationship("TransactionDocument", back_populates="transaction", cascade="all, delete-orphan")
    messages = relationship("TransactionMessage", back_populates="transaction", cascade="all, delete-orphan")
    taches = relationship("TransactionTache", back_populates="transaction", cascade="all, delete-orphan")
    etapes = relationship("TransactionEtape", back_populates="transaction", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<PortailTransaction(id={self.id}, type={self.type}, statut={self.statut})>"
