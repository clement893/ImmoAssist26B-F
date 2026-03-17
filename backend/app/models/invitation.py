"""
Invitation Model
SQLAlchemy model for team/user invitations
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, func, Index
from sqlalchemy.orm import relationship
import secrets

from app.core.database import Base


class Invitation(Base):
    """Invitation model for team/user invitations"""
    __tablename__ = "invitations"
    __table_args__ = (
        Index("idx_invitations_email", "email"),
        Index("idx_invitations_token", "token"),
        Index("idx_invitations_team", "team_id"),
        Index("idx_invitations_status", "status"),
        Index("idx_invitations_expires_at", "expires_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True, index=True)  # Null for user invitation
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True, index=True)  # Role to assign
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, accepted, expired, cancelled
    message = Column(Text, nullable=True)  # Custom invitation message
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    team = relationship("Team", back_populates="invitations")
    role = relationship("Role")
    invited_by = relationship("User", back_populates="sent_invitations")

    @staticmethod
    def generate_token() -> str:
        """Generate a secure invitation token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def default_expires_at() -> datetime:
        """Default expiration: 7 days from now"""
        return datetime.now(timezone.utc) + timedelta(days=7)

    def is_expired(self) -> bool:
        """Check if invitation is expired"""
        return datetime.now(timezone.utc) > self.expires_at

    def is_valid(self) -> bool:
        """Check if invitation is valid (not expired and pending)"""
        return self.status == "pending" and not self.is_expired()

    def __repr__(self) -> str:
        return f"<Invitation(id={self.id}, email={self.email}, status={self.status})>"

