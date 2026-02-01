"""
Calendar Availability Endpoints
API endpoints for managing user calendar availability
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.user_availability import UserAvailability, DayOfWeek
from app.schemas.user_availability import (
    UserAvailabilityCreate,
    UserAvailabilityUpdate,
    UserAvailabilityResponse,
    UserAvailabilityListResponse,
)

router = APIRouter(prefix="/calendar/availability", tags=["calendar-availability"])


@router.get("/", response_model=UserAvailabilityListResponse)
async def list_availabilities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    day_of_week: Optional[DayOfWeek] = Query(None, description="Filter by day of week"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """Get list of user availabilities"""
    query = select(UserAvailability).where(UserAvailability.user_id == current_user.id)
    
    if day_of_week:
        query = query.where(UserAvailability.day_of_week == day_of_week)
    
    if is_active is not None:
        query = query.where(UserAvailability.is_active == is_active)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    query = query.order_by(UserAvailability.day_of_week, UserAvailability.start_time)
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    availabilities = result.scalars().all()
    
    return UserAvailabilityListResponse(
        availabilities=[UserAvailabilityResponse.model_validate(av) for av in availabilities],
        total=total
    )


@router.get("/me", response_model=UserAvailabilityListResponse)
async def get_my_availabilities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
):
    """Get current user's availabilities (all, no pagination)"""
    query = select(UserAvailability).where(UserAvailability.user_id == current_user.id)
    
    if is_active is not None:
        query = query.where(UserAvailability.is_active == is_active)
    
    query = query.order_by(UserAvailability.day_of_week, UserAvailability.start_time)
    
    result = await db.execute(query)
    availabilities = result.scalars().all()
    
    return UserAvailabilityListResponse(
        availabilities=[UserAvailabilityResponse.model_validate(av) for av in availabilities],
        total=len(availabilities)
    )


@router.post("/", response_model=UserAvailabilityResponse, status_code=status.HTTP_201_CREATED)
async def create_availability(
    availability_data: UserAvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new availability slot"""
    # Check for overlapping availabilities on the same day
    existing_query = select(UserAvailability).where(
        and_(
            UserAvailability.user_id == current_user.id,
            UserAvailability.day_of_week == availability_data.day_of_week,
            UserAvailability.is_active == True,
        )
    )
    existing_result = await db.execute(existing_query)
    existing_availabilities = existing_result.scalars().all()
    
    # Check for overlaps
    for existing in existing_availabilities:
        if not (availability_data.end_time <= existing.start_time or availability_data.start_time >= existing.end_time):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cette disponibilité chevauche avec une autre disponibilité existante pour {availability_data.day_of_week.value}"
            )
    
    # Create new availability
    availability = UserAvailability(
        user_id=current_user.id,
        **availability_data.model_dump()
    )
    
    db.add(availability)
    await db.commit()
    await db.refresh(availability)
    
    return UserAvailabilityResponse.model_validate(availability)


@router.get("/{availability_id}", response_model=UserAvailabilityResponse)
async def get_availability(
    availability_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific availability by ID"""
    result = await db.execute(
        select(UserAvailability).where(
            and_(
                UserAvailability.id == availability_id,
                UserAvailability.user_id == current_user.id
            )
        )
    )
    availability = result.scalar_one_or_none()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disponibilité non trouvée"
        )
    
    return UserAvailabilityResponse.model_validate(availability)


@router.put("/{availability_id}", response_model=UserAvailabilityResponse)
async def update_availability(
    availability_id: int,
    availability_data: UserAvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an availability"""
    result = await db.execute(
        select(UserAvailability).where(
            and_(
                UserAvailability.id == availability_id,
                UserAvailability.user_id == current_user.id
            )
        )
    )
    availability = result.scalar_one_or_none()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disponibilité non trouvée"
        )
    
    # Get update data
    update_dict = availability_data.model_dump(exclude_unset=True)
    
    # If updating times or day, check for overlaps
    if any(key in update_dict for key in ['day_of_week', 'start_time', 'end_time']):
        day_of_week = update_dict.get('day_of_week', availability.day_of_week)
        start_time = update_dict.get('start_time', availability.start_time)
        end_time = update_dict.get('end_time', availability.end_time)
        
        # Check for overlapping availabilities (excluding current one)
        existing_query = select(UserAvailability).where(
            and_(
                UserAvailability.user_id == current_user.id,
                UserAvailability.day_of_week == day_of_week,
                UserAvailability.id != availability_id,
                UserAvailability.is_active == True,
            )
        )
        existing_result = await db.execute(existing_query)
        existing_availabilities = existing_result.scalars().all()
        
        # Check for overlaps
        for existing in existing_availabilities:
            if not (end_time <= existing.start_time or start_time >= existing.end_time):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cette disponibilité chevauche avec une autre disponibilité existante pour {day_of_week.value}"
                )
    
    # Update fields
    for field, value in update_dict.items():
        setattr(availability, field, value)
    
    await db.commit()
    await db.refresh(availability)
    
    return UserAvailabilityResponse.model_validate(availability)


@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_availability(
    availability_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an availability"""
    result = await db.execute(
        select(UserAvailability).where(
            and_(
                UserAvailability.id == availability_id,
                UserAvailability.user_id == current_user.id
            )
        )
    )
    availability = result.scalar_one_or_none()
    
    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disponibilité non trouvée"
        )
    
    await db.delete(availability)
    await db.commit()
    
    return None
