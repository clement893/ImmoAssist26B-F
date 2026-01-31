"""
Theme Font schemas for API requests and responses.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ThemeFontBase(BaseModel):
    """Base schema for theme font."""
    name: str = Field(..., min_length=1, max_length=200, description="Display name for the font")
    font_family: str = Field(..., min_length=1, max_length=100, description="CSS font-family name")
    description: Optional[str] = Field(None, description="Font description")
    font_format: str = Field(..., description="Font format: woff, woff2, ttf, or otf")
    font_weight: Optional[str] = Field(None, description="Font weight: normal, bold, 400, 700, etc.")
    font_style: Optional[str] = Field(None, description="Font style: normal, italic, oblique")


class ThemeFontCreate(ThemeFontBase):
    """Schema for creating a theme font."""
    file_key: str = Field(..., description="S3 key or storage path")
    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    mime_type: str = Field(..., description="MIME type: font/woff, font/woff2, font/ttf, font/otf")
    url: str = Field(..., description="Presigned URL or public URL")


class ThemeFontResponse(ThemeFontBase):
    """Schema for theme font response."""
    id: int
    file_key: str
    filename: str
    file_size: int
    mime_type: str
    url: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ThemeFontListResponse(BaseModel):
    """Schema for listing theme fonts."""
    fonts: list[ThemeFontResponse]
    total: int

