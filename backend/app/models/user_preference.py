"""
User Preferences Model
User-specific settings and preferences
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, JSON, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserPreference(Base):
    """User preference model"""
    
    __tablename__ = "user_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_user_preferences_user_key"),
        Index("idx_user_preferences_user", "user_id"),
        Index("idx_user_preferences_key", "key"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(100), nullable=False, index=True)  # e.g., 'theme', 'language', 'notifications'
    value = Column(JSON, nullable=True)  # Preference value (can be any JSON-serializable type)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="preferences")
    
    def __repr__(self) -> str:
        return f"<UserPreference(id={self.id}, user_id={self.user_id}, key={self.key}, value={self.value})>"




