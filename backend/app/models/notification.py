"""
Notification Model
User notifications system
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class Notification(Base):
    """Notification model for user notifications"""
    
    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notifications_user_id", "user_id"),
        Index("idx_notifications_read", "read"),
        Index("idx_notifications_created_at", "created_at"),
        Index("idx_notifications_type", "notification_type"),
        Index("idx_notifications_user_read", "user_id", "read"),  # Composite index for common query
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Notification content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(20), default=NotificationType.INFO.value, nullable=False, index=True)
    
    # Status
    read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Action button (optional)
    action_url = Column(String(500), nullable=True)
    action_label = Column(String(100), nullable=True)
    
    # Additional metadata (JSON)
    # Note: Python attribute is 'notification_metadata' to avoid SQLAlchemy reserved name conflict
    # Database column remains 'metadata' for backward compatibility
    notification_metadata = Column("metadata", JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="notifications")
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, title={self.title}, read={self.read})>"
    
    def mark_as_read(self) -> None:
        """Mark notification as read"""
        from datetime import datetime, timezone
        self.read = True
        self.read_at = datetime.now(timezone.utc)

