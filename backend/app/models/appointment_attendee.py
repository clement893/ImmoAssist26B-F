"""
Appointment Attendee Model
SQLAlchemy model for appointment participants
"""

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class AttendeeStatus(str, enum.Enum):
    ACCEPTED = "accepted"
    DECLINED = "declined"
    TENTATIVE = "tentative"
    NEEDS_ACTION = "needs_action"


class AppointmentAttendee(Base):
    """Attendee model for appointment participants (clients, notaries, etc.)"""

    __tablename__ = "appointment_attendees"
    __table_args__ = (
        Index("idx_appointment_attendees_appointment_id", "appointment_id"),
        Index("idx_appointment_attendees_contact_id", "contact_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(Integer, ForeignKey("real_estate_contacts.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    status = Column(SQLEnum(AttendeeStatus), default=AttendeeStatus.NEEDS_ACTION, nullable=False)

    appointment = relationship("Appointment", back_populates="attendees")
    contact = relationship("RealEstateContact", backref="appointment_attendances")
