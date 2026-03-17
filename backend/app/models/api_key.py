"""
API Key Model
SQLAlchemy model for API key management with rotation support
"""

from datetime import datetime, timedelta
from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, func, Index, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class APIKey(Base):
    """API Key model with rotation support"""
    __tablename__ = "api_keys"
    __table_args__ = (
        Index("idx_api_keys_user_id", "user_id"),
        Index("idx_api_keys_key_hash", "key_hash"),
        Index("idx_api_keys_is_active", "is_active"),
        Index("idx_api_keys_expires_at", "expires_at"),
        Index("idx_api_keys_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    key_hash = Column(String(255), unique=True, nullable=False, index=True)
    key_prefix = Column(String(20), nullable=False)  # e.g., 'sk_live_', 'sk_test_'
    
    # Rotation fields
    rotation_policy = Column(String(50), default="manual", nullable=False)  # manual, 30d, 60d, 90d, 180d, 365d
    last_rotated_at = Column(DateTime(timezone=True), nullable=True)
    next_rotation_at = Column(DateTime(timezone=True), nullable=True, index=True)
    rotation_count = Column(Integer, default=0, nullable=False)
    
    # Usage tracking
    last_used_at = Column(DateTime(timezone=True), nullable=True, index=True)
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="api_keys")
    
    def __repr__(self) -> str:
        return f"<APIKey(id={self.id}, name={self.name}, user_id={self.user_id}, is_active={self.is_active})>"
    
    def is_expired(self) -> bool:
        """Check if API key is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def needs_rotation(self) -> bool:
        """Check if API key needs rotation based on policy"""
        if not self.next_rotation_at:
            return False
        return datetime.utcnow() >= self.next_rotation_at
    
    def is_valid(self) -> bool:
        """Check if API key is valid (active and not expired)"""
        return self.is_active and not self.is_expired() and not self.revoked_at

