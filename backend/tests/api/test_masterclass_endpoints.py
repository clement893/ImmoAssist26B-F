"""
API tests for Masterclass endpoints
"""

import pytest
from httpx import AsyncClient
from datetime import date
from decimal import Decimal

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
async def test_list_events(async_client: AsyncClient, db):
    """Test listing all masterclass events"""
    # Create a test event
    event = MasterclassEvent(
        title_en="Test Event",
        title_fr="Événement Test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    
    response = await async_client.get("/api/v1/masterclass/events")
    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    assert "total" in data
    assert isinstance(data["events"], list)


@pytest.mark.asyncio
async def test_get_event_by_id(async_client: AsyncClient, db):
    """Test getting event by ID"""
    event = MasterclassEvent(
        title_en="Test Event",
        title_fr="Événement Test",
        duration_days=2,
        language="English"
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    response = await async_client.get(f"/api/v1/masterclass/events/{event.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == event.id
    assert data["title_en"] == "Test Event"


@pytest.mark.asyncio
async def test_get_event_not_found(async_client: AsyncClient):
    """Test getting non-existent event"""
    response = await async_client.get("/api/v1/masterclass/events/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_cities_with_events(async_client: AsyncClient, db):
    """Test listing cities with events"""
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
    
    response = await async_client.get("/api/v1/masterclass/cities")
    assert response.status_code == 200
    data = response.json()
    assert "cities" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_availability(async_client: AsyncClient, db):
    """Test getting availability for a city event"""
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
    
    response = await async_client.get(f"/api/v1/masterclass/city-events/{city_event.id}/availability")
    assert response.status_code == 200
    data = response.json()
    assert data["city_event_id"] == city_event.id
    assert data["total_capacity"] == 30
    assert "available_spots" in data
    assert "status" in data