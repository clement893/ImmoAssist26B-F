"""
Appointment Schemas
Pydantic models for appointments (rendez-vous)
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict, field_validator

from app.models.appointment import AppointmentStatus
from app.models.appointment_attendee import AttendeeStatus


class AppointmentAttendeeBase(BaseModel):
    """Base attendee schema"""
    email: str = Field(..., max_length=255, description="Email de l'invité")
    name: Optional[str] = Field(None, max_length=255)
    contact_id: Optional[int] = Field(None, description="ID du contact RealEstateContact si lié")
    status: AttendeeStatus = Field(default=AttendeeStatus.NEEDS_ACTION)

    model_config = ConfigDict(from_attributes=True)


class AppointmentAttendeeCreate(AppointmentAttendeeBase):
    """Attendee creation schema"""
    pass


class AppointmentAttendeeResponse(AppointmentAttendeeBase):
    """Attendee response schema"""
    id: int
    appointment_id: int

    model_config = ConfigDict(from_attributes=True)


class AppointmentBase(BaseModel):
    """Base appointment schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None)
    start_time: datetime = Field(..., description="Début du rendez-vous (timezone-aware)")
    end_time: datetime = Field(..., description="Fin du rendez-vous (timezone-aware)")
    status: AppointmentStatus = Field(default=AppointmentStatus.CONFIRMED)
    transaction_id: Optional[int] = Field(None)

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: datetime, info) -> datetime:
        if "start_time" in info.data and info.data["start_time"] and v <= info.data["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v

    model_config = ConfigDict(from_attributes=True)


class AppointmentCreate(AppointmentBase):
    """Appointment creation schema"""
    attendees: List[AppointmentAttendeeCreate] = Field(default_factory=list)


class AppointmentUpdate(BaseModel):
    """Appointment update schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None)
    start_time: Optional[datetime] = Field(None)
    end_time: Optional[datetime] = Field(None)
    status: Optional[AppointmentStatus] = Field(None)
    transaction_id: Optional[int] = Field(None)
    attendees: Optional[List[AppointmentAttendeeCreate]] = Field(None)

    model_config = ConfigDict(from_attributes=True)


class AppointmentResponse(AppointmentBase):
    """Appointment response schema"""
    id: int
    broker_id: int
    created_at: datetime
    updated_at: datetime
    attendees: List[AppointmentAttendeeResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AppointmentListResponse(BaseModel):
    """List response for appointments"""
    appointments: List[AppointmentResponse] = Field(..., description="List of appointments")
    total: int = Field(..., description="Total count")


class AvailabilitySlot(BaseModel):
    """A single availability slot for booking"""
    start: datetime
    end: datetime


class AvailabilityResponse(BaseModel):
    """Response for availability endpoint"""
    slots: List[AvailabilitySlot] = Field(..., description="Available time slots")
