"""
User Availability Schemas
Pydantic v2 models for user availability management
"""

from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.user_availability import DayOfWeek


class UserAvailabilityBase(BaseModel):
    """Base user availability schema"""
    day_of_week: DayOfWeek = Field(..., description="Day of the week")
    start_time: time = Field(..., description="Start time (HH:MM)")
    end_time: time = Field(..., description="End time (HH:MM)")
    is_active: bool = Field(default=True, description="Whether this availability slot is active")
    label: Optional[str] = Field(None, max_length=200, description="Optional label for this slot (e.g., 'Matin', 'Après-midi')")
    
    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v: time, info) -> time:
        """Validate that end_time is after start_time"""
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class UserAvailabilityCreate(UserAvailabilityBase):
    """User availability creation schema"""
    pass


class UserAvailabilityUpdate(BaseModel):
    """User availability update schema"""
    day_of_week: Optional[DayOfWeek] = Field(None, description="Day of the week")
    start_time: Optional[time] = Field(None, description="Start time (HH:MM)")
    end_time: Optional[time] = Field(None, description="End time (HH:MM)")
    is_active: Optional[bool] = Field(None, description="Whether this availability slot is active")
    label: Optional[str] = Field(None, max_length=200, description="Optional label for this slot")
    
    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, v: Optional[time], info) -> Optional[time]:
        """Validate that end_time is after start_time if both are provided"""
        if v is not None and 'start_time' in info.data and info.data['start_time'] is not None:
            if v <= info.data['start_time']:
                raise ValueError('end_time must be after start_time')
        return v


class UserAvailabilityResponse(UserAvailabilityBase):
    """User availability response schema"""
    id: int = Field(..., description="Availability ID")
    user_id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class UserAvailabilityListResponse(BaseModel):
    """List response for user availabilities"""
    availabilities: list[UserAvailabilityResponse] = Field(..., description="List of availabilities")
    total: int = Field(..., description="Total count")
