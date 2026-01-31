"""
Integration Model
SQLAlchemy model for third-party integrations
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, Index, JSON, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Integration(Base):
    """Third-party integration model"""
    __tablename__ = "integrations"
    __table_args__ = (
        Index("idx_integrations_user_id", "user_id"),
        Index("idx_integrations_type", "type"),
        Index("idx_integrations_enabled", "enabled"),
        Index("idx_integrations_user_type", "user_id", "type", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)  # e.g., 'slack', 'github', 'stripe'
    name = Column(String(200), nullable=False)  # Display name
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, default=False, nullable=False, index=True)
    config = Column(JSON, nullable=True)  # Integration-specific configuration (encrypted in production)
    credentials = Column(JSON, nullable=True)  # Encrypted credentials (e.g., API keys, tokens)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    error_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="integrations")

    def __repr__(self) -> str:
        return f"<Integration(id={self.id}, user_id={self.user_id}, type={self.type}, enabled={self.enabled})>"


