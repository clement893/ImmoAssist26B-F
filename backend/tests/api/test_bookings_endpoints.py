"""
API tests for Booking endpoints
"""

import pytest
from httpx import AsyncClient
from datetime import date
from decimal import Decimal

from app.models.booking import Booking, BookingStatus, PaymentStatus, TicketType
from app.models.masterclass import MasterclassEvent, City, Venue, CityEvent, EventStatus
from app.main import app


@pytest.fixture
async def async_client(db):
    """Create async test client"""
    from app.core.database import get_db
    
    async def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_booking(async_client: AsyncClient, db):
    """Test creating a booking"""
    # Create test data
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
    booking_data = {
        "city_event_id": city_event.id,
        "attendee_name": "John Doe",
        "attendee_email": "john@example.com",
        "attendee_phone": "+1234567890",
        "ticket_type": "regular",
        "quantity": 1
    }
    
    response = await async_client.post("/api/v1/bookings/create", json=booking_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["attendee_name"] == "John Doe"
    assert data["attendee_email"] == "john@example.com"
    assert "booking_reference" in data
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_booking_by_reference(async_client: AsyncClient, db):
    """Test getting booking by reference"""
    # Create test booking
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
        booking_reference="MC2025-TEST123",
        status=BookingStatus.PENDING,
        attendee_name="John Doe",
        attendee_email="john@example.com",
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
    
    response = await async_client.get(f"/api/v1/bookings/{booking.booking_reference}")
    assert response.status_code == 200
    data = response.json()
    assert data["booking_reference"] == "MC2025-TEST123"
    assert data["attendee_name"] == "John Doe"


@pytest.mark.asyncio
async def test_get_booking_not_found(async_client: AsyncClient):
    """Test getting non-existent booking"""
    response = await async_client.get("/api/v1/bookings/INVALID123")
    assert response.status_code == 404