"""
User Availability Model
SQLAlchemy model for user availability/calendar availability management
"""

from datetime import datetime, time
import enum
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Time, Boolean, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class DayOfWeek(str, enum.Enum):
    """Day of week enum"""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class UserAvailability(Base):
    """User availability model for calendar management"""
    __tablename__ = "user_availabilities"
    __table_args__ = (
        Index("idx_user_availabilities_user_id", "user_id"),
        Index("idx_user_availabilities_day_of_week", "day_of_week"),
        Index("idx_user_availabilities_is_active", "is_active"),
        Index("idx_user_availabilities_user_day", "user_id", "day_of_week"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Day of week
    day_of_week = Column(SQLEnum(DayOfWeek), nullable=False, index=True)
    
    # Time slots
    start_time = Column(Time, nullable=False)  # e.g., 09:00
    end_time = Column(Time, nullable=False)    # e.g., 17:00
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Optional: Label/description for this availability slot
    label = Column(String(200), nullable=True)  # e.g., "Matin", "Après-midi", "Soirée"
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="availabilities")
    
    def __repr__(self) -> str:
        return f"<UserAvailability(id={self.id}, user_id={self.user_id}, day={self.day_of_week}, {self.start_time}-{self.end_time})>"
