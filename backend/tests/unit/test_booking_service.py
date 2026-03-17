"""
Unit tests for Booking Service
"""

import pytest
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.booking_service import BookingService
from app.services.availability_service import AvailabilityService
from app.models.booking import Booking, BookingStatus, PaymentStatus, TicketType
from app.models.masterclass import CityEvent, EventStatus
from app.schemas.booking import BookingCreate, AttendeeCreate


@pytest.mark.asyncio
async def test_generate_booking_reference():
    """Test booking reference generation"""
    db = MagicMock(spec=AsyncSession)
    service = BookingService(db)
    
    reference = service.generate_booking_reference()
    
    assert reference is not None
    assert isinstance(reference, str)
    assert reference.startswith("MC")
    assert len(reference) > 10


@pytest.mark.asyncio
async def test_calculate_price_regular(db: AsyncSession):
    """Test price calculation for regular ticket"""
    service = BookingService(db)
    
    city_event = CityEvent(
        id=1,
        regular_price=Decimal("1200.00"),
        early_bird_price=None,
        early_bird_deadline=None,
        group_discount_percentage=10,
        group_minimum=3
    )
    
    subtotal, discount, total = await service.calculate_price(
        city_event,
        TicketType.REGULAR,
        1
    )
    
    assert subtotal == Decimal("1200.00")
    assert discount == Decimal("0.00")
    assert total == Decimal("1200.00")


@pytest.mark.asyncio
async def test_calculate_price_early_bird(db: AsyncSession):
    """Test price calculation for early bird ticket"""
    service = BookingService(db)
    
    city_event = CityEvent(
        id=1,
        regular_price=Decimal("1200.00"),
        early_bird_price=Decimal("960.00"),
        early_bird_deadline=date(2025, 12, 31),
        group_discount_percentage=10,
        group_minimum=3
    )
    
    subtotal, discount, total = await service.calculate_price(
        city_event,
        TicketType.EARLY_BIRD,
        1
    )
    
    assert subtotal == Decimal("960.00")
    assert discount == Decimal("0.00")
    assert total == Decimal("960.00")


@pytest.mark.asyncio
async def test_calculate_price_group(db: AsyncSession):
    """Test price calculation for group ticket"""
    service = BookingService(db)
    
    city_event = CityEvent(
        id=1,
        regular_price=Decimal("1200.00"),
        early_bird_price=None,
        early_bird_deadline=None,
        group_discount_percentage=10,
        group_minimum=3
    )
    
    subtotal, discount, total = await service.calculate_price(
        city_event,
        TicketType.GROUP,
        3
    )
    
    assert subtotal == Decimal("3600.00")  # 1200 * 3
    assert discount == Decimal("360.00")  # 10% of 3600
    assert total == Decimal("3240.00")  # 3600 - 360


@pytest.mark.asyncio
async def test_is_almost_full():
    """Test is_almost_full calculation"""
    db = MagicMock(spec=AsyncSession)
    service = AvailabilityService(db)
    
    # Test with < 20% available
    assert service.is_almost_full(5, 30) is True
    
    # Test with > 20% available
    assert service.is_almost_full(10, 30) is False
    
    # Test with exactly 20%
    assert service.is_almost_full(6, 30) is False  # 20% exactly


@pytest.mark.asyncio
async def test_is_sold_out():
    """Test is_sold_out calculation"""
    db = MagicMock(spec=AsyncSession)
    service = AvailabilityService(db)
    
    assert service.is_sold_out(0) is True
    assert service.is_sold_out(1) is False
    assert service.is_sold_out(10) is False