"""
Calendar Connection Model
SQLAlchemy model for external calendar OAuth tokens (Google, Outlook)
"""

import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class CalendarProvider(str, enum.Enum):
    GOOGLE = "google"
    OUTLOOK = "outlook"


class CalendarConnection(Base):
    """Calendar connection for a user (one per provider: Google or Outlook)"""

    __tablename__ = "calendar_connections"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_calendar_connection_user_provider"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(SQLEnum(CalendarProvider), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    scope = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="calendar_connections")
