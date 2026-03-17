"""
Unit tests for Booking models
"""

import pytest
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import (
    Booking, Attendee, BookingPayment,
    BookingStatus, PaymentStatus, TicketType
)
from app.models.masterclass import (
    MasterclassEvent, City, Venue, CityEvent, EventStatus
)


@pytest.mark.asyncio
async def test_create_booking(db: AsyncSession):
    """Test creating a booking"""
    # Create dependencies
    event = MasterclassEvent(
        title_en="Test Event",
        title_fr="Événement Test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    city = City(
        name_en="Toronto",
        name_fr="Toronto",
        province="Ontario",
        country="Canada"
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)
    
    venue = Venue(
        city_id=city.id,
        name="Test Venue",
        capacity=30
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    
    city_event = CityEvent(
        event_id=event.id,
        city_id=city.id,
        venue_id=venue.id,
        start_date=date(2025, 7, 15),
        end_date=date(2025, 7, 16),
        total_capacity=30,
        available_spots=30,
        status=EventStatus.PUBLISHED,
        regular_price=Decimal("1200.00")
    )
    db.add(city_event)
    await db.commit()
    await db.refresh(city_event)
    
    # Create booking
    booking = Booking(
        city_event_id=city_event.id,
        booking_reference="MC2025-ABC123",
        status=BookingStatus.PENDING,
        attendee_name="John Doe",
        attendee_email="john@example.com",
        attendee_phone="+1234567890",
        ticket_type=TicketType.REGULAR,
        quantity=1,
        subtotal=Decimal("1200.00"),
        discount=Decimal("0.00"),
        total=Decimal("1200.00"),
        payment_status=PaymentStatus.PENDING
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    
    assert booking.id is not None
    assert booking.booking_reference == "MC2025-ABC123"
    assert booking.status == BookingStatus.PENDING
    assert booking.attendee_name == "John Doe"
    assert booking.attendee_email == "john@example.com"
    assert booking.quantity == 1
    assert booking.total == Decimal("1200.00")
    assert booking.payment_status == PaymentStatus.PENDING


@pytest.mark.asyncio
async def test_create_attendee(db: AsyncSession):
    """Test creating an attendee"""
    # Create booking first
    event = MasterclassEvent(
        title_en="Test Event",
        title_fr="Événement Test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    city = City(
        name_en="Toronto",
        name_fr="Toronto",
        province="Ontario",
        country="Canada"
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)
    
    venue = Venue(
        city_id=city.id,
        name="Test Venue",
        capacity=30
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    
    city_event = CityEvent(
        event_id=event.id,
        city_id=city.id,
        venue_id=venue.id,
        start_date=date(2025, 7, 15),
        end_date=date(2025, 7, 16),
        total_capacity=30,
        available_spots=30,
        status=EventStatus.PUBLISHED,
        regular_price=Decimal("1200.00")
    )
    db.add(city_event)
    await db.commit()
    await db.refresh(city_event)
    
    booking = Booking(
        city_event_id=city_event.id,
        booking_reference="MC2025-ABC123",
        status=BookingStatus.PENDING,
        attendee_name="John Doe",
        attendee_email="john@example.com",
        ticket_type=TicketType.REGULAR,
        quantity=1,
        subtotal=Decimal("1200.00"),
        total=Decimal("1200.00"),
        payment_status=PaymentStatus.PENDING
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    
    # Create attendee
    attendee = Attendee(
        booking_id=booking.id,
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        phone="+1234567890",
        role="Psychologist",
        experience_level="Intermediate",
        dietary_restrictions="Vegetarian"
    )
    db.add(attendee)
    await db.commit()
    await db.refresh(attendee)
    
    assert attendee.id is not None
    assert attendee.booking_id == booking.id
    assert attendee.first_name == "John"
    assert attendee.last_name == "Doe"
    assert attendee.email == "john@example.com"
    assert attendee.role == "Psychologist"
    assert attendee.experience_level == "Intermediate"


@pytest.mark.asyncio
async def test_create_booking_payment(db: AsyncSession):
    """Test creating a booking payment"""
    # Create booking
    event = MasterclassEvent(
        title_en="Test Event",
        title_fr="Événement Test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    city = City(
        name_en="Toronto",
        name_fr="Toronto",
        province="Ontario",
        country="Canada"
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)
    
    venue = Venue(
        city_id=city.id,
        name="Test Venue",
        capacity=30
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    
    city_event = CityEvent(
        event_id=event.id,
        city_id=city.id,
        venue_id=venue.id,
        start_date=date(2025, 7, 15),
        end_date=date(2025, 7, 16),
        total_capacity=30,
        available_spots=30,
        status=EventStatus.PUBLISHED,
        regular_price=Decimal("1200.00")
    )
    db.add(city_event)
    await db.commit()
    await db.refresh(city_event)
    
    booking = Booking(
        city_event_id=city_event.id,
        booking_reference="MC2025-ABC123",
        status=BookingStatus.PENDING,
        attendee_name="John Doe",
        attendee_email="john@example.com",
        ticket_type=TicketType.REGULAR,
        quantity=1,
        subtotal=Decimal("1200.00"),
        total=Decimal("1200.00"),
        payment_status=PaymentStatus.PENDING
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    
    # Create payment
    payment = BookingPayment(
        booking_id=booking.id,
        payment_intent_id="pi_test_123456",
        amount=Decimal("1200.00"),
        currency="CAD",
        status=PaymentStatus.PAID,
        stripe_charge_id="ch_test_123456"
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    assert payment.id is not None
    assert payment.booking_id == booking.id
    assert payment.payment_intent_id == "pi_test_123456"
    assert payment.amount == Decimal("1200.00")
    assert payment.currency == "CAD"
    assert payment.status == PaymentStatus.PAID


@pytest.mark.asyncio
async def test_booking_relationships(db: AsyncSession):
    """Test Booking relationships"""
    # Create all dependencies
    event = MasterclassEvent(
        title_en="Test Event",
        title_fr="Événement Test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    city = City(
        name_en="Toronto",
        name_fr="Toronto",
        province="Ontario",
        country="Canada"
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)
    
    venue = Venue(
        city_id=city.id,
        name="Test Venue",
        capacity=30
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    
    city_event = CityEvent(
        event_id=event.id,
        city_id=city.id,
        venue_id=venue.id,
        start_date=date(2025, 7, 15),
        end_date=date(2025, 7, 16),
        total_capacity=30,
        available_spots=30,
        status=EventStatus.PUBLISHED,
        regular_price=Decimal("1200.00")
    )
    db.add(city_event)
    await db.commit()
    await db.refresh(city_event)
    
    booking = Booking(
        city_event_id=city_event.id,
        booking_reference="MC2025-ABC123",
        status=BookingStatus.PENDING,
        attendee_name="John Doe",
        attendee_email="john@example.com",
        ticket_type=TicketType.REGULAR,
        quantity=1,
        subtotal=Decimal("1200.00"),
        total=Decimal("1200.00"),
        payment_status=PaymentStatus.PENDING
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    
    # Create attendee
    attendee = Attendee(
        booking_id=booking.id,
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )
    db.add(attendee)
    await db.commit()
    
    # Create payment
    payment = BookingPayment(
        booking_id=booking.id,
        payment_intent_id="pi_test_123456",
        amount=Decimal("1200.00"),
        currency="CAD",
        status=PaymentStatus.PAID
    )
    db.add(payment)
    await db.commit()
    
    # Test relationships
    await db.refresh(booking)
    assert booking.city_event.id == city_event.id
    assert len(booking.attendees) == 1
    assert booking.attendees[0].id == attendee.id
    assert len(booking.payments) == 1
    assert booking.payments[0].id == payment.id