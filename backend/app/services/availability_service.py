"""
Availability Service
Service for calculating event availability and status
"""

from typing import Optional, Dict, Any
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.city_event import CityEvent, EventStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.masterclass import AvailabilityResponse
from app.core.logging import logger


class AvailabilityService:
    """Service for calculating event availability"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def calculate_available_spots(self, city_event_id: int) -> int:
        """
        Calculate available spots for a city event
        
        Args:
            city_event_id: City event ID
            
        Returns:
            Number of available spots
        """
        # Get city event with capacity
        result = await self.db.execute(
            select(CityEvent)
            .where(CityEvent.id == city_event_id)
        )
        city_event = result.scalar_one_or_none()
        
        if not city_event:
            raise ValueError(f"City event {city_event_id} not found")
        
        # Count confirmed bookings (quantity)
        confirmed_bookings_query = select(
            func.sum(Booking.quantity).label("total_booked")
        ).where(
            and_(
                Booking.city_event_id == city_event_id,
                Booking.status == BookingStatus.CONFIRMED
            )
        )
        
        result = await self.db.execute(confirmed_bookings_query)
        total_booked = result.scalar_one_or_none() or 0
        
        if total_booked is None:
            total_booked = 0
        
        # Calculate available spots
        available = city_event.total_capacity - total_booked
        return max(0, available)  # Ensure non-negative
    
    async def update_available_spots(self, city_event_id: int) -> int:
        """
        Update and return available spots for a city event
        
        Args:
            city_event_id: City event ID
            
        Returns:
            Updated available spots count
        """
        available_spots = await self.calculate_available_spots(city_event_id)
        
        # Update city event
        result = await self.db.execute(
            select(CityEvent)
            .where(CityEvent.id == city_event_id)
        )
        city_event = result.scalar_one_or_none()
        
        if city_event:
            city_event.available_spots = available_spots
            
            # Update status based on availability
            if available_spots == 0:
                city_event.status = EventStatus.SOLD_OUT
            elif available_spots > 0 and city_event.status == EventStatus.SOLD_OUT:
                city_event.status = EventStatus.PUBLISHED
            
            await self.db.commit()
            await self.db.refresh(city_event)
        
        return available_spots
    
    def is_almost_full(self, available_spots: int, total_capacity: int) -> bool:
        """
        Check if event is almost full (< 20% available)
        
        Args:
            available_spots: Number of available spots
            total_capacity: Total capacity
            
        Returns:
            True if < 20% available
        """
        if total_capacity == 0:
            return False
        
        percentage_available = (available_spots / total_capacity) * 100
        return percentage_available < 20
    
    def is_sold_out(self, available_spots: int) -> bool:
        """
        Check if event is sold out
        
        Args:
            available_spots: Number of available spots
            
        Returns:
            True if sold out (available_spots == 0)
        """
        return available_spots == 0
    
    async def get_availability(self, city_event_id: int) -> AvailabilityResponse:
        """
        Get full availability information for a city event
        
        Args:
            city_event_id: City event ID
            
        Returns:
            AvailabilityResponse with full availability details
        """
        # Get city event with relationships
        result = await self.db.execute(
            select(CityEvent)
            .where(CityEvent.id == city_event_id)
        )
        city_event = result.scalar_one_or_none()
        
        if not city_event:
            raise ValueError(f"City event {city_event_id} not found")
        
        # Calculate available spots
        available_spots = await self.calculate_available_spots(city_event_id)
        total_capacity = city_event.total_capacity
        booked_spots = total_capacity - available_spots
        
        # Calculate percentage
        percentage_available = (available_spots / total_capacity * 100) if total_capacity > 0 else 0
        
        # Determine status
        if self.is_sold_out(available_spots):
            status = "sold_out"
        elif self.is_almost_full(available_spots, total_capacity):
            status = "almost_full"
        else:
            status = "available"
        
        return AvailabilityResponse(
            city_event_id=city_event_id,
            total_capacity=total_capacity,
            available_spots=available_spots,
            booked_spots=booked_spots,
            percentage_available=round(percentage_available, 2),
            status=status,
            is_almost_full=self.is_almost_full(available_spots, total_capacity),
            is_sold_out=self.is_sold_out(available_spots),
        )