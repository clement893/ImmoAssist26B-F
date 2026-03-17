"""Pydantic schemas for Property Listing (Chrome extension import)."""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PropertyListingImport(BaseModel):
    """Payload for importing a property from a third-party site (Centris, etc.)."""

    source_url: str = Field(..., min_length=1, max_length=2048, description="URL of the listing page")
    source_name: str = Field(..., min_length=1, max_length=255, description="Source name, e.g. Centris")
    data: Dict[str, Any] = Field(..., description="Extracted listing data (address, price, etc.)")
    transaction_id: Optional[int] = Field(None, description="Optional transaction to link this listing to")


class PropertyListingResponse(BaseModel):
    """Response after importing a property."""

    id: int
    source_url: str
    source_name: str
    transaction_id: Optional[int]
    created_at: str

    class Config:
        from_attributes = True
