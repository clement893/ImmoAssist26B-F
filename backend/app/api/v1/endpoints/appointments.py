"""
Appointments Endpoints
API endpoints for appointment (rendez-vous) management
"""

from datetime import datetime, date, time, timedelta
from typing import Optional, List
import zoneinfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus
from app.models.appointment_attendee import AppointmentAttendee
from app.models.user_availability import UserAvailability, DayOfWeek
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AppointmentListResponse,
    AppointmentAttendeeCreate,
    AppointmentAttendeeResponse,
    AvailabilityResponse,
    AvailabilitySlot,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])

# Map weekday() to DayOfWeek: Monday=0 -> MONDAY, Sunday=6 -> SUNDAY
WEEKDAY_TO_DAY_OF_WEEK = {
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY,
}


def _make_aware(d: datetime, tz_name: str = "UTC") -> datetime:
    if d.tzinfo is not None:
        return d
    tz = zoneinfo.ZoneInfo(tz_name)
    return d.replace(tzinfo=tz)


@router.get("/", response_model=AppointmentListResponse)
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    transaction_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None, description="Filter appointments starting from this date"),
    date_to: Optional[datetime] = Query(None, description="Filter appointments ending before this date"),
):
    """List appointments for the current user (broker)."""
    query = select(Appointment).where(Appointment.broker_id == current_user.id)
    if status_filter is not None:
        query = query.where(Appointment.status == status_filter)
    if transaction_id is not None:
        query = query.where(Appointment.transaction_id == transaction_id)
    if date_from is not None:
        query = query.where(Appointment.end_time >= _make_aware(date_from))
    if date_to is not None:
        query = query.where(Appointment.start_time <= _make_aware(date_to))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.options(selectinload(Appointment.attendees)).order_by(Appointment.start_time.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    appointments = result.scalars().all()
    return AppointmentListResponse(
        appointments=[AppointmentResponse.model_validate(a) for a in appointments],
        total=total,
    )


@router.get("/availability", response_model=AvailabilityResponse)
async def get_availability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    date_from: date = Query(..., description="Start date for slot search"),
    date_to: date = Query(..., description="End date for slot search"),
    duration_minutes: int = Query(30, ge=15, le=480),
):
    """
    Return available time slots for the current broker.
    Uses UserAvailability (recurring weekly) and existing appointments to compute free slots.
    """
    if date_to < date_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="date_to must be >= date_from")
    if (date_to - date_from).days > 90:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Range cannot exceed 90 days")

    # Load user availabilities (recurring by day of week)
    av_result = await db.execute(
        select(UserAvailability).where(
            and_(UserAvailability.user_id == current_user.id, UserAvailability.is_active == True)
        )
    )
    availabilities = av_result.scalars().all()
    if not availabilities:
        return AvailabilityResponse(slots=[])

    # Load existing appointments in range (any status that blocks time: confirmed, pending)
    start_dt = datetime.combine(date_from, time.min, tzinfo=zoneinfo.ZoneInfo("UTC"))
    end_dt = datetime.combine(date_to, time.max, tzinfo=zoneinfo.ZoneInfo("UTC"))
    app_result = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.broker_id == current_user.id,
                Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
                Appointment.start_time < end_dt,
                Appointment.end_time > start_dt,
            )
        )
    )
    busy = app_result.scalars().all()
    duration_delta = timedelta(minutes=duration_minutes)
    slots: List[AvailabilitySlot] = []
    tz = zoneinfo.ZoneInfo("UTC")

    current = date_from
    while current <= date_to:
        weekday = current.weekday()
        day_enum = WEEKDAY_TO_DAY_OF_WEEK[weekday]
        for av in availabilities:
            if av.day_of_week != day_enum:
                continue
            # Combine date with av.start_time / av.end_time
            slot_start = datetime.combine(current, av.start_time, tzinfo=tz)
            slot_end = datetime.combine(current, av.end_time, tzinfo=tz)
            if slot_end <= slot_start:
                continue
            # Clip to requested range
            if slot_start < start_dt:
                slot_start = start_dt
            if slot_end > end_dt:
                slot_end = end_dt
            if slot_start >= slot_end:
                continue
            # Split by busy periods
            busy_on_day = [(b.start_time, b.end_time) for b in busy if b.start_time < slot_end and b.end_time > slot_start]
            busy_on_day.sort(key=lambda x: x[0])
            cursor = slot_start
            for b_start, b_end in busy_on_day:
                if b_start > cursor and (b_start - cursor) >= duration_delta:
                    slots.append(AvailabilitySlot(start=cursor, end=b_start))
                cursor = max(cursor, b_end)
            if slot_end > cursor and (slot_end - cursor) >= duration_delta:
                slots.append(AvailabilitySlot(start=cursor, end=slot_end))
        current += timedelta(days=1)

    slots.sort(key=lambda s: s.start)
    return AvailabilityResponse(slots=slots)


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new appointment."""
    if data.end_time <= data.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")
    # Optional: check user owns transaction_id if provided
    if data.transaction_id is not None:
        from app.models.real_estate_transaction import RealEstateTransaction
        txn = await db.get(RealEstateTransaction, data.transaction_id)
        if txn is None or txn.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    appointment = Appointment(
        broker_id=current_user.id,
        title=data.title,
        description=data.description,
        start_time=_make_aware(data.start_time),
        end_time=_make_aware(data.end_time),
        status=data.status,
        transaction_id=data.transaction_id,
    )
    db.add(appointment)
    await db.flush()
    for att in data.attendees:
        attendee = AppointmentAttendee(
            appointment_id=appointment.id,
            email=att.email,
            name=att.name,
            contact_id=att.contact_id,
            status=att.status,
        )
        db.add(attendee)
    await db.commit()
    await db.refresh(appointment)
    await db.refresh(appointment, ["attendees"])
    return AppointmentResponse.model_validate(appointment)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single appointment by ID."""
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.attendees))
        .where(and_(Appointment.id == appointment_id, Appointment.broker_id == current_user.id))
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    return AppointmentResponse.model_validate(appointment)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an appointment."""
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.attendees))
        .where(and_(Appointment.id == appointment_id, Appointment.broker_id == current_user.id))
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")

    update_dict = data.model_dump(exclude_unset=True)
    if "attendees" in update_dict:
        attendees_data = update_dict.pop("attendees")
        # Replace attendees
        for a in appointment.attendees:
            await db.delete(a)
        await db.flush()
        for att in attendees_data:
            attendee = AppointmentAttendee(
                appointment_id=appointment.id,
                email=att.email,
                name=att.name,
                contact_id=att.contact_id,
                status=att.status,
            )
            db.add(attendee)
    for key, value in update_dict.items():
        if key in ("start_time", "end_time") and value is not None:
            value = _make_aware(value)
        setattr(appointment, key, value)
    if appointment.end_time <= appointment.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")
    await db.commit()
    await db.refresh(appointment)
    await db.refresh(appointment, ["attendees"])
    return AppointmentResponse.model_validate(appointment)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete (cancel) an appointment."""
    result = await db.execute(
        select(Appointment).where(and_(Appointment.id == appointment_id, Appointment.broker_id == current_user.id))
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    await db.delete(appointment)
    await db.commit()
    return None
