"""File schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FileBase(BaseModel):
    """Base file schema."""

    filename: str = Field(..., min_length=1, max_length=255)
    original_filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., min_length=1, max_length=100)
    size: int = Field(..., gt=0)
    url: str = Field(..., min_length=1, max_length=1000)
    folder: Optional[str] = Field(None, max_length=100)


class FileCreate(FileBase):
    """File creation schema."""

    file_key: str = Field(..., min_length=1, max_length=500)


class FileResponse(FileBase):
    """File response schema."""

    id: UUID
    user_id: UUID
    file_key: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """File upload response schema."""

    id: UUID
    filename: str
    original_filename: str
    size: int
    url: str
    content_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

