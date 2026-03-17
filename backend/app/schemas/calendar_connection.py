"""
Calendar Connection Schemas
Pydantic models for calendar OAuth connections
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.calendar_connection import CalendarProvider


class CalendarConnectionResponse(BaseModel):
    """Calendar connection response (no tokens)"""
    id: int
    user_id: int
    provider: CalendarProvider
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarConnectionListResponse(BaseModel):
    """List of calendar connections for current user"""
    connections: list[CalendarConnectionResponse] = Field(..., description="List of connections")
