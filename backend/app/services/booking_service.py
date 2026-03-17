"""
Booking Service
Service for handling booking operations
"""

import secrets
import string
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.booking import Booking, Attendee, BookingStatus, PaymentStatus, TicketType
from app.models.city_event import CityEvent, EventStatus
from app.schemas.booking import BookingCreate, BookingResponse, AttendeeCreate
from app.services.availability_service import AvailabilityService
from app.core.logging import logger


class BookingService:
    """Service for booking operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.availability_service = AvailabilityService(db)
    
    def generate_booking_reference(self) -> str:
        """
        Generate unique booking reference (e.g., MC2025-ABC123)
        
        Returns:
            Unique booking reference string
        """
        # Format: MC2025-XXXXXX (6 random alphanumeric characters)
        year = datetime.now().year
        random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        return f"MC{year}-{random_part}"
    
    async def calculate_price(
        self,
        city_event: CityEvent,
        ticket_type: TicketType,
        quantity: int,
    ) -> tuple[Decimal, Decimal, Decimal]:
        """
        Calculate booking price (subtotal, discount, total)
        
        Args:
            city_event: CityEvent object
            ticket_type: Type of ticket (REGULAR, EARLY_BIRD, GROUP)
            quantity: Number of tickets
            
        Returns:
            Tuple of (subtotal, discount, total)
        """
        today = date.today()
        
        # Determine base price per ticket
        if ticket_type == TicketType.EARLY_BIRD and city_event.early_bird_deadline:
            if today <= city_event.early_bird_deadline and city_event.early_bird_price:
                base_price = city_event.early_bird_price
            else:
                # Early bird deadline passed, use regular price
                base_price = city_event.regular_price
        elif ticket_type == TicketType.GROUP and quantity >= city_event.group_minimum:
            # Group discount: regular price with percentage discount
            base_price = city_event.regular_price
        else:
            # Regular price
            base_price = city_event.regular_price
        
        # Calculate subtotal (price per ticket × quantity)
        subtotal = base_price * quantity
        
        # Calculate discount
        discount = Decimal(0)
        if ticket_type == TicketType.GROUP and quantity >= city_event.group_minimum:
            # Apply group discount percentage
            discount_amount = subtotal * (city_event.group_discount_percentage / 100)
            discount = discount_amount
        
        # Calculate total (subtotal - discount)
        total = subtotal - discount
        
        return subtotal, discount, total
    
    async def create_booking(self, booking_data: BookingCreate) -> Booking:
        """
        Create a new booking
        
        Args:
            booking_data: BookingCreate schema with booking details
            
        Returns:
            Created Booking object
            
        Raises:
            ValueError: If city event not found or not available
        """
        # Get city event
        result = await self.db.execute(
            select(CityEvent)
            .where(CityEvent.id == booking_data.city_event_id)
        )
        city_event = result.scalar_one_or_none()
        
        if not city_event:
            raise ValueError(f"City event {booking_data.city_event_id} not found")
        
        # Check availability
        available_spots = await self.availability_service.calculate_available_spots(city_event.id)
        
        if available_spots < booking_data.quantity:
            raise ValueError(
                f"Not enough spots available. Requested: {booking_data.quantity}, Available: {available_spots}"
            )
        
        if city_event.status == EventStatus.SOLD_OUT:
            raise ValueError("Event is sold out")
        
        if city_event.status != EventStatus.PUBLISHED:
            raise ValueError(f"Event is not available for booking (status: {city_event.status})")
        
        # Determine ticket type if not specified
        ticket_type = booking_data.ticket_type
        
        # Check if early bird applies
        today = date.today()
        if city_event.early_bird_deadline and today <= city_event.early_bird_deadline:
            if not ticket_type or ticket_type == TicketType.REGULAR:
                ticket_type = TicketType.EARLY_BIRD
        
        # Check if group discount applies
        if booking_data.quantity >= city_event.group_minimum and ticket_type != TicketType.EARLY_BIRD:
            ticket_type = TicketType.GROUP
        
        # Calculate price
        subtotal, discount, total = await self.calculate_price(
            city_event,
            ticket_type,
            booking_data.quantity,
        )
        
        # Generate unique booking reference
        booking_reference = self.generate_booking_reference()
        
        # Ensure uniqueness of booking reference
        max_attempts = 10
        for attempt in range(max_attempts):
            existing = await self.db.execute(
                select(Booking)
                .where(Booking.booking_reference == booking_reference)
            )
            if existing.scalar_one_or_none() is None:
                break
            booking_reference = self.generate_booking_reference()
        else:
            raise ValueError("Failed to generate unique booking reference")
        
        # Create booking
        booking = Booking(
            city_event_id=booking_data.city_event_id,
            booking_reference=booking_reference,
            status=BookingStatus.PENDING,
            attendee_name=booking_data.attendee_name,
            attendee_email=booking_data.attendee_email,
            attendee_phone=booking_data.attendee_phone,
            ticket_type=ticket_type,
            quantity=booking_data.quantity,
            subtotal=subtotal,
            discount=discount,
            total=total,
            payment_status=PaymentStatus.PENDING,
        )
        
        self.db.add(booking)
        await self.db.flush()  # Flush to get booking.id
        
        # Create attendees if provided
        if booking_data.attendees:
            for attendee_data in booking_data.attendees:
                attendee = Attendee(
                    booking_id=booking.id,
                    first_name=attendee_data.first_name,
                    last_name=attendee_data.last_name,
                    email=attendee_data.email,
                    phone=attendee_data.phone,
                    role=attendee_data.role,
                    experience_level=attendee_data.experience_level,
                    dietary_restrictions=attendee_data.dietary_restrictions,
                )
                self.db.add(attendee)
        else:
            # Create single attendee from booking info
            attendee = Attendee(
                booking_id=booking.id,
                first_name=booking_data.attendee_name.split()[0] if booking_data.attendee_name else "Unknown",
                last_name=" ".join(booking_data.attendee_name.split()[1:]) if len(booking_data.attendee_name.split()) > 1 else "",
                email=booking_data.attendee_email,
                phone=booking_data.attendee_phone,
            )
            self.db.add(attendee)
        
        await self.db.commit()
        await self.db.refresh(booking)
        
        # Update availability (async, non-blocking)
        try:
            await self.availability_service.update_available_spots(city_event.id)
        except Exception as e:
            logger.warning(f"Failed to update availability for city_event {city_event.id}: {e}")
        
        return booking
    
    async def get_booking_by_reference(self, booking_reference: str) -> Optional[Booking]:
        """
        Get booking by reference
        
        Args:
            booking_reference: Unique booking reference
            
        Returns:
            Booking object or None
        """
        result = await self.db.execute(
            select(Booking)
            .options(selectinload(Booking.attendees), selectinload(Booking.city_event))
            .where(Booking.booking_reference == booking_reference)
        )
        return result.scalar_one_or_none()
    
    async def cancel_booking(self, booking_reference: str) -> Booking:
        """
        Cancel a booking
        
        Args:
            booking_reference: Unique booking reference
            
        Returns:
            Cancelled Booking object
            
        Raises:
            ValueError: If booking not found or cannot be cancelled
        """
        booking = await self.get_booking_by_reference(booking_reference)
        
        if not booking:
            raise ValueError(f"Booking {booking_reference} not found")
        
        if booking.status == BookingStatus.CANCELLED:
            raise ValueError("Booking is already cancelled")
        
        if booking.status == BookingStatus.REFUNDED:
            raise ValueError("Booking is already refunded")
        
        # Update booking status
        booking.status = BookingStatus.CANCELLED
        booking.cancelled_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(booking)
        
        # Update availability (release spots)
        try:
            await self.availability_service.update_available_spots(booking.city_event_id)
        except Exception as e:
            logger.warning(f"Failed to update availability for city_event {booking.city_event_id}: {e}")
        
        return booking