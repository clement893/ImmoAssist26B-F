"""
CityEvent Model
SQLAlchemy model for city events (masterclass events in specific cities)
This is a minimal stub model to satisfy the Booking relationship.
"""

from datetime import datetime
import enum
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class EventStatus(str, enum.Enum):
    """Event status enum"""
    DRAFT = "draft"
    PUBLISHED = "published"
    SOLD_OUT = "sold_out"
    CANCELLED = "cancelled"


class CityEvent(Base):
    """CityEvent model - stub for Booking relationship"""
    __tablename__ = "city_events"
    __table_args__ = (
        Index("idx_city_events_event_id", "event_id"),
        Index("idx_city_events_city_id", "city_id"),
        Index("idx_city_events_start_date", "start_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("masterclass_events.id"), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=True)  # Can be EventStatus enum values
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    bookings = relationship("Booking", back_populates="city_event", lazy="select")

    def __repr__(self) -> str:
        return f"<CityEvent(id={self.id}, event_id={self.event_id}, city_id={self.city_id})>"
