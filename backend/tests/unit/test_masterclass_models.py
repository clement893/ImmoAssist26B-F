"""
Unit tests for Masterclass models
"""

import pytest
from datetime import date, time, datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.masterclass import (
    MasterclassEvent, City, Venue, CityEvent, EventStatus
)


@pytest.mark.asyncio
async def test_create_masterclass_event(db: AsyncSession):
    """Test creating a masterclass event"""
    event = MasterclassEvent(
        title_en="Trauma-Focused ACT Masterclass",
        title_fr="Masterclass ACT Centré sur le Trauma",
        description_en="Test description",
        description_fr="Description de test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    assert event.id is not None
    assert event.title_en == "Trauma-Focused ACT Masterclass"
    assert event.title_fr == "Masterclass ACT Centré sur le Trauma"
    assert event.duration_days == 2
    assert event.language == "English"
    assert event.created_at is not None


@pytest.mark.asyncio
async def test_create_city(db: AsyncSession):
    """Test creating a city"""
    city = City(
        name_en="Toronto",
        name_fr="Toronto",
        province="Ontario",
        country="Canada",
        timezone="America/Toronto",
        image_url="/images/cities/toronto.jpg"
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)
    
    assert city.id is not None
    assert city.name_en == "Toronto"
    assert city.name_fr == "Toronto"
    assert city.province == "Ontario"
    assert city.country == "Canada"
    assert city.timezone == "America/Toronto"


@pytest.mark.asyncio
async def test_create_venue(db: AsyncSession):
    """Test creating a venue"""
    # First create a city
    city = City(
        name_en="Toronto",
        name_fr="Toronto",
        province="Ontario",
        country="Canada",
        timezone="America/Toronto"
    )
    db.add(city)
    await db.commit()
    await db.refresh(city)
    
    # Then create venue
    venue = Venue(
        city_id=city.id,
        name="Toronto Convention Centre",
        address="255 Front St W, Toronto, ON M5V 2W6",
        postal_code="M5V 2W6",
        capacity=30,
        amenities={"wifi": True, "parking": True}
    )
    db.add(venue)
    await db.commit()
    await db.refresh(venue)
    
    assert venue.id is not None
    assert venue.city_id == city.id
    assert venue.name == "Toronto Convention Centre"
    assert venue.capacity == 30
    assert venue.amenities["wifi"] is True


@pytest.mark.asyncio
async def test_create_city_event(db: AsyncSession):
    """Test creating a city event"""
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
        country="Canada",
        timezone="America/Toronto"
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
    
    # Create city event
    start_date = date(2025, 7, 15)
    end_date = date(2025, 7, 16)
    city_event = CityEvent(
        event_id=event.id,
        city_id=city.id,
        venue_id=venue.id,
        start_date=start_date,
        end_date=end_date,
        start_time=time(9, 0),
        end_time=time(17, 0),
        total_capacity=30,
        available_spots=30,
        status=EventStatus.PUBLISHED,
        early_bird_deadline=date(2025, 5, 15),
        early_bird_price=Decimal("960.00"),
        regular_price=Decimal("1200.00"),
        group_discount_percentage=10,
        group_minimum=3
    )
    db.add(city_event)
    await db.commit()
    await db.refresh(city_event)
    
    assert city_event.id is not None
    assert city_event.event_id == event.id
    assert city_event.city_id == city.id
    assert city_event.venue_id == venue.id
    assert city_event.start_date == start_date
    assert city_event.end_date == end_date
    assert city_event.total_capacity == 30
    assert city_event.available_spots == 30
    assert city_event.status == EventStatus.PUBLISHED
    assert city_event.regular_price == Decimal("1200.00")
    assert city_event.group_discount_percentage == 10


@pytest.mark.asyncio
async def test_city_event_relationships(db: AsyncSession):
    """Test CityEvent relationships"""
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
    
    # Test relationships
    assert city_event.event.id == event.id
    assert city_event.city.id == city.id
    assert city_event.venue.id == venue.id