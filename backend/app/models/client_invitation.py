"""
Client Invitation Model (Portail client ImmoAssist)
SQLAlchemy model for broker-to-client invitations
"""

import secrets
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClientInvitation(Base):
    """Client invitation for portail client - broker invites client by email"""
    __tablename__ = "client_invitations"
    __table_args__ = (
        Index("idx_client_invitations_courtier_id", "courtier_id"),
        Index("idx_client_invitations_email", "email"),
        Index("idx_client_invitations_statut", "statut"),
        Index("idx_client_invitations_token", "token"),
    )

    id = Column(Integer, primary_key=True, index=True)
    courtier_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prenom = Column(String(100), nullable=False)
    nom = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    telephone = Column(String(50), nullable=True)
    type_projet = Column(String(50), nullable=False)  # 'achat', 'vente', 'location'
    statut = Column(String(50), default="invite", nullable=False)  # 'invite', 'actif', 'inactif'
    token = Column(String(64), unique=True, nullable=False, index=True)
    date_invitation = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_activation = Column(DateTime(timezone=True), nullable=True)
    derniere_connexion = Column(DateTime(timezone=True), nullable=True)
    message_personnalise = Column(Text, nullable=True)

    # Permissions
    acces_documents = Column(Boolean, default=True, nullable=False)
    acces_messagerie = Column(Boolean, default=True, nullable=False)
    acces_taches = Column(Boolean, default=True, nullable=False)
    acces_calendrier = Column(Boolean, default=True, nullable=False)
    acces_proprietes = Column(Boolean, default=True, nullable=False)

    # Relationships
    courtier = relationship("User", back_populates="invitations_portail", foreign_keys=[courtier_id])
    client_user = relationship("User", back_populates="invitation_portail", foreign_keys="User.client_invitation_id")
    transactions = relationship("PortailTransaction", back_populates="client_invitation", cascade="all, delete-orphan")

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    def __repr__(self) -> str:
        return f"<ClientInvitation(id={self.id}, email={self.email}, statut={self.statut})>"
