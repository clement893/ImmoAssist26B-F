"""
Property Listings Endpoints
Import de propriétés depuis l'extension Chrome (Centris, etc.)
Authentification par API key uniquement (extension).
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.api_key import require_api_key
from app.models.user import User
from app.models.property_listing import PropertyListing
from app.schemas.property_listing import PropertyListingImport, PropertyListingResponse
from app.core.logging import logger

router = APIRouter(prefix="/property-listings", tags=["property-listings"])


@router.post("/import", response_model=PropertyListingResponse)
async def import_property_listing(
    payload: PropertyListingImport,
    current_user: Annotated[User, Depends(require_api_key)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Import a property listing from a third-party site (e.g. Centris).
    Called by the ImmoAssist Chrome extension.
    Requires API key authentication (X-API-Key header or api_key query).
    """
    try:
        listing = PropertyListing(
            source_url=payload.source_url,
            source_name=payload.source_name,
            data=payload.data,
            broker_id=current_user.id,
            transaction_id=payload.transaction_id,
        )
        db.add(listing)
        await db.commit()
        await db.refresh(listing)
    except IntegrityError as e:
        await db.rollback()
        if "source_url" in str(e.orig).lower() or "unique" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cette propriété a déjà été importée (URL en double).",
            ) from e
        logger.exception("Property listing import integrity error")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Données invalides ou transaction introuvable.",
        ) from e
    return PropertyListingResponse(
        id=listing.id,
        source_url=listing.source_url,
        source_name=listing.source_name,
        transaction_id=listing.transaction_id,
        created_at=listing.created_at.isoformat(),
    )
