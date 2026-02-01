"""
Appointment Model
SQLAlchemy model for appointments (rendez-vous)
"""

import enum
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Index, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AppointmentStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    PENDING = "pending"
    CANCELLED = "cancelled"


class Appointment(Base):
    """Appointment model for broker rendez-vous"""

    __tablename__ = "appointments"
    __table_args__ = (
        Index("idx_appointments_broker_id", "broker_id"),
        Index("idx_appointments_start_time", "start_time"),
        Index("idx_appointments_status", "status"),
        Index("idx_appointments_transaction_id", "transaction_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.CONFIRMED, nullable=False)

    broker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id", ondelete="SET NULL"), nullable=True)

    google_event_id = Column(String(255), nullable=True, unique=True)
    outlook_event_id = Column(String(255), nullable=True, unique=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    attendees = relationship("AppointmentAttendee", back_populates="appointment", cascade="all, delete-orphan")
    broker = relationship("User", back_populates="appointments")
    transaction = relationship("RealEstateTransaction", back_populates="appointments")
