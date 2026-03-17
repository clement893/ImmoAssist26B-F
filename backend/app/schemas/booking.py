"""
Booking Schemas
Pydantic schemas for bookings and attendees
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr

from app.models.booking import BookingStatus, PaymentStatus, TicketType


# Attendee Schemas
class AttendeeBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, max_length=100)  # Psychologue, thérapeute, coach
    experience_level: Optional[str] = Field(None, max_length=50)  # Débutant, Intermédiaire, Avancé
    dietary_restrictions: Optional[str] = None


class AttendeeCreate(AttendeeBase):
    pass


class AttendeeResponse(AttendeeBase):
    id: int
    booking_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Booking Schemas
class BookingBase(BaseModel):
    city_event_id: int
    attendee_name: str = Field(..., max_length=200)
    attendee_email: EmailStr
    attendee_phone: Optional[str] = Field(None, max_length=50)
    ticket_type: TicketType = TicketType.REGULAR
    quantity: int = Field(default=1, ge=1, le=10)


class BookingCreate(BookingBase):
    attendees: Optional[List[AttendeeCreate]] = None  # Si quantity > 1, créer plusieurs attendees


class BookingUpdate(BaseModel):
    attendee_name: Optional[str] = Field(None, max_length=200)
    attendee_email: Optional[EmailStr] = None
    attendee_phone: Optional[str] = Field(None, max_length=50)
    quantity: Optional[int] = Field(None, ge=1, le=10)


class BookingResponse(BaseModel):
    id: int
    city_event_id: int
    booking_reference: str
    status: BookingStatus
    attendee_name: str
    attendee_email: str
    attendee_phone: Optional[str]
    ticket_type: TicketType
    quantity: int
    subtotal: Decimal
    discount: Decimal
    total: Decimal
    payment_status: PaymentStatus
    payment_intent_id: Optional[str]
    created_at: datetime
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    attendees: List[AttendeeResponse] = []

    class Config:
        from_attributes = True


class BookingSummaryResponse(BaseModel):
    """Summary response for booking confirmation"""
    booking_reference: str
    city: str
    city_fr: str
    venue_name: str
    venue_address: Optional[str]
    start_date: str  # ISO format
    end_date: str  # ISO format
    attendee_name: str
    attendee_email: str
    quantity: int
    total: Decimal
    payment_status: PaymentStatus


# Payment Schemas
class PaymentIntentCreate(BaseModel):
    """Request to create Stripe PaymentIntent"""
    booking_id: int


class PaymentIntentResponse(BaseModel):
    """Response with Stripe PaymentIntent client_secret"""
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str = "EUR"


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    payment_intent_id: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    stripe_charge_id: Optional[str]
    refund_id: Optional[str]
    created_at: datetime
    refunded_at: Optional[datetime]

    class Config:
        from_attributes = True
