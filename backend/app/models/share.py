"""
Share Model
Sharing and permissions system for entities
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, func, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PermissionLevel(str, enum.Enum):
    """Permission levels"""
    VIEW = "view"  # Can view only
    COMMENT = "comment"  # Can view and comment
    EDIT = "edit"  # Can view, comment, and edit
    ADMIN = "admin"  # Full admin access


class Share(Base):
    """Share model for sharing entities with users/teams"""
    
    __tablename__ = "shares"
    __table_args__ = (
        Index("idx_shares_entity", "entity_type", "entity_id"),
        Index("idx_shares_shared_with", "shared_with_type", "shared_with_id"),
        Index("idx_shares_created_by", "created_by_id"),
        Index("idx_shares_unique", "entity_type", "entity_id", "shared_with_type", "shared_with_id", unique=True),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Entity being shared
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'project', 'file', 'document'
    entity_id = Column(Integer, nullable=False, index=True)  # ID of the shared entity
    
    # Who it's shared with (polymorphic)
    shared_with_type = Column(String(20), nullable=False)  # 'user' or 'team'
    shared_with_id = Column(Integer, nullable=False)  # User ID or Team ID
    
    # Permissions
    permission_level = Column(SQLEnum(PermissionLevel), default=PermissionLevel.VIEW, nullable=False)
    
    # Sharing details
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration
    
    # Access control
    requires_password = Column(Boolean, default=False, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Hashed password if required
    
    # Link sharing
    share_token = Column(String(100), nullable=True, unique=True, index=True)  # Token for public link sharing
    is_public_link = Column(Boolean, default=False, nullable=False)  # Public link (anyone with token)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id], backref="shares_created")
    
    def __repr__(self) -> str:
        return f"<Share(id={self.id}, entity_type={self.entity_type}, entity_id={self.entity_id}, shared_with_type={self.shared_with_type}, permission_level={self.permission_level.value})>"


class ShareAccessLog(Base):
    """Log of share access attempts"""
    
    __tablename__ = "share_access_logs"
    __table_args__ = (
        Index("idx_share_access_share", "share_id"),
        Index("idx_share_access_user", "user_id"),
        Index("idx_share_access_timestamp", "timestamp"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    share_id = Column(Integer, ForeignKey("shares.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Access details
    access_type = Column(String(20), nullable=False)  # 'view', 'edit', 'download', etc.
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    share = relationship("Share", backref="access_logs")
    user = relationship("User", backref="share_access_logs")
    
    def __repr__(self) -> str:
        return f"<ShareAccessLog(id={self.id}, share_id={self.share_id}, user_id={self.user_id}, access_type={self.access_type}, success={self.success})>"




