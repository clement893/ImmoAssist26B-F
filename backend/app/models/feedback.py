"""
Feedback Model
User feedback and support tickets
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class FeedbackType(str, enum.Enum):
    """Feedback type"""
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    QUESTION = "question"
    COMPLAINT = "complaint"
    PRAISE = "praise"
    OTHER = "other"


class FeedbackStatus(str, enum.Enum):
    """Feedback status"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Feedback(Base):
    """Feedback model"""
    
    __tablename__ = "feedback"
    __table_args__ = (
        Index("idx_feedback_user", "user_id"),
        Index("idx_feedback_status", "status"),
        Index("idx_feedback_type", "type"),
        Index("idx_feedback_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Feedback content
    type = Column(SQLEnum(FeedbackType), nullable=False, index=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(SQLEnum(FeedbackStatus), default=FeedbackStatus.OPEN, nullable=False, index=True)
    priority = Column(Integer, default=1, nullable=False)  # 1=low, 2=medium, 3=high, 4=critical
    
    # Additional context
    url = Column(String(500), nullable=True)  # Page/feature URL where feedback was submitted
    user_agent = Column(String(500), nullable=True)
    feedback_metadata = Column(Text, nullable=True)  # JSON string for additional data (renamed from metadata to avoid SQLAlchemy conflict)
    
    # Response
    response = Column(Text, nullable=True)
    responded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="feedback")
    responded_by = relationship("User", foreign_keys=[responded_by_id])
    
    def __repr__(self) -> str:
        return f"<Feedback(id={self.id}, type={self.type}, status={self.status}, user_id={self.user_id})>"


class FeedbackAttachment(Base):
    """Feedback attachments (screenshots, files)"""
    
    __tablename__ = "feedback_attachments"
    __table_args__ = (
        Index("idx_feedback_attachments_feedback", "feedback_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(200), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    feedback = relationship("Feedback", backref="attachments")
    
    def __repr__(self) -> str:
        return f"<FeedbackAttachment(id={self.id}, feedback_id={self.feedback_id}, file_name={self.file_name})>"

