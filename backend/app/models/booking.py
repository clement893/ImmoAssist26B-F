"""
Booking Models
SQLAlchemy models for masterclass bookings
"""

from datetime import datetime
from sqlalchemy import (
    Column, DateTime, Integer, String, Text, ForeignKey, Numeric,
    Enum as SQLEnum, Boolean, func, Index
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    """Booking status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    """Payment status"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class TicketType(str, enum.Enum):
    """Ticket type"""
    REGULAR = "regular"
    EARLY_BIRD = "early_bird"
    GROUP = "group"


class Booking(Base):
    """Booking model - reservation for masterclass event"""
    __tablename__ = "bookings"
    __table_args__ = (
        Index("idx_bookings_city_event_id", "city_event_id"),
        Index("idx_bookings_reference", "booking_reference"),
        Index("idx_bookings_email", "attendee_email"),
        Index("idx_bookings_status", "status"),
        Index("idx_bookings_payment_status", "payment_status"),
        Index("idx_bookings_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    city_event_id = Column(
        Integer,
        ForeignKey("city_events.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    # Booking reference (unique identifier)
    booking_reference = Column(String(20), unique=True, nullable=False, index=True)

    # Status
    status = Column(
        SQLEnum(BookingStatus),
        default=BookingStatus.PENDING,
        nullable=False,
        index=True
    )

    # Attendee info (main attendee)
    attendee_name = Column(String(200), nullable=False)
    attendee_email = Column(String(200), nullable=False, index=True)
    attendee_phone = Column(String(50), nullable=True)

    # Ticket details
    ticket_type = Column(
        SQLEnum(TicketType),
        default=TicketType.REGULAR,
        nullable=False
    )
    quantity = Column(Integer, default=1, nullable=False)

    # Pricing
    subtotal = Column(Numeric(10, 2), nullable=False)  # Prix unitaire × quantité
    discount = Column(Numeric(10, 2), default=0, nullable=False)  # Remise groupe/early bird
    total = Column(Numeric(10, 2), nullable=False)  # Total après remise

    # Payment
    payment_status = Column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True
    )
    payment_intent_id = Column(String(200), nullable=True)  # Stripe PaymentIntent ID
    payment_method_id = Column(String(200), nullable=True)  # Stripe PaymentMethod ID

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    city_event = relationship("CityEvent", back_populates="bookings", lazy="select")
    attendees = relationship("Attendee", back_populates="booking", cascade="all, delete-orphan", lazy="select")
    payments = relationship("BookingPayment", back_populates="booking", lazy="select")

    def __repr__(self) -> str:
        return f"<Booking(id={self.id}, reference={self.booking_reference}, status={self.status})>"


class Attendee(Base):
    """Attendee model - individual participant details"""
    __tablename__ = "attendees"
    __table_args__ = (
        Index("idx_attendees_booking_id", "booking_id"),
        Index("idx_attendees_email", "email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=False, index=True)
    phone = Column(String(50), nullable=True)

    role = Column(String(100), nullable=True)  # Psychologue, thérapeute, coach, etc.
    experience_level = Column(String(50), nullable=True)  # Débutant, Intermédiaire, Avancé
    dietary_restrictions = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="attendees", lazy="select")

    def __repr__(self) -> str:
        return f"<Attendee(id={self.id}, name={self.first_name} {self.last_name}, booking_id={self.booking_id})>"


class BookingPayment(Base):
    """Booking payment model - payment transactions"""
    __tablename__ = "booking_payments"
    __table_args__ = (
        Index("idx_booking_payments_booking_id", "booking_id"),
        Index("idx_booking_payments_payment_intent_id", "payment_intent_id"),
        Index("idx_booking_payments_status", "status"),
        Index("idx_booking_payments_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(
        Integer,
        ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    payment_intent_id = Column(String(200), unique=True, nullable=False, index=True)  # Stripe PaymentIntent ID
    amount = Column(Numeric(10, 2), nullable=False)  # Montant en CAD
    currency = Column(String(3), default="CAD", nullable=False)

    status = Column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True
    )

    stripe_charge_id = Column(String(200), nullable=True)  # Stripe Charge ID
    refund_id = Column(String(200), nullable=True)  # Stripe Refund ID (si remboursé)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="payments", lazy="select")

    def __repr__(self) -> str:
        return f"<BookingPayment(id={self.id}, payment_intent_id={self.payment_intent_id}, status={self.status})>"
