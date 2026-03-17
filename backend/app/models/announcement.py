"""
Announcement Model
System announcements and banners
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class AnnouncementType(str, enum.Enum):
    """Announcement type"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    PROMOTION = "promotion"


class AnnouncementPriority(str, enum.Enum):
    """Announcement priority"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Announcement(Base):
    """Announcement model"""
    
    __tablename__ = "announcements"
    __table_args__ = (
        Index("idx_announcements_active", "is_active"),
        Index("idx_announcements_start_date", "start_date"),
        Index("idx_announcements_end_date", "end_date"),
        Index("idx_announcements_priority", "priority"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SQLEnum(AnnouncementType), default=AnnouncementType.INFO, nullable=False)
    priority = Column(SQLEnum(AnnouncementPriority), default=AnnouncementPriority.MEDIUM, nullable=False, index=True)
    
    # Display settings
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_dismissible = Column(Boolean, default=True, nullable=False)
    show_on_login = Column(Boolean, default=False, nullable=False)  # Show on login page
    show_in_app = Column(Boolean, default=True, nullable=False)  # Show in application
    
    # Scheduling
    start_date = Column(DateTime(timezone=True), nullable=True, index=True)
    end_date = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Targeting
    target_users = Column(Text, nullable=True)  # JSON array of user IDs
    target_teams = Column(Text, nullable=True)  # JSON array of team IDs
    target_roles = Column(Text, nullable=True)  # JSON array of role names
    
    # Action button
    action_label = Column(String(100), nullable=True)
    action_url = Column(String(500), nullable=True)
    
    # Metadata
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    created_by = relationship("User", backref="announcements")
    
    def __repr__(self) -> str:
        return f"<Announcement(id={self.id}, title={self.title}, type={self.type}, is_active={self.is_active})>"


class AnnouncementDismissal(Base):
    """Track which users have dismissed announcements"""
    
    __tablename__ = "announcement_dismissals"
    __table_args__ = (
        Index("idx_announcement_dismissals_user", "user_id"),
        Index("idx_announcement_dismissals_announcement", "announcement_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(Integer, ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    dismissed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    announcement = relationship("Announcement", backref="dismissals")
    user = relationship("User", backref="announcement_dismissals")
    
    def __repr__(self) -> str:
        return f"<AnnouncementDismissal(id={self.id}, announcement_id={self.announcement_id}, user_id={self.user_id})>"




