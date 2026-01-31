"""
User Preferences API Endpoints
"""

from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy.exc import ProgrammingError, OperationalError

from app.services.user_preference_service import UserPreferenceService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


def clean_preference_value(value: Any) -> Any:
    """Recursively clean preference values to ensure JSON serialization"""
    if value is None:
        return None
    elif isinstance(value, (str, int, float, bool)):
        return value
    elif isinstance(value, datetime):
        # Convert datetime to ISO format string
        return value.isoformat() if hasattr(value, 'isoformat') else str(value)
    elif isinstance(value, dict):
        return {k: clean_preference_value(v) for k, v in value.items()}
    elif isinstance(value, (list, tuple)):
        return [clean_preference_value(item) for item in value]
    else:
        # For any other type, try to convert to string
        try:
            # Try JSON serialization first
            import json
            json.dumps(value)
            return value
        except (TypeError, ValueError):
            # If not serializable, convert to string
            return str(value)


class PreferenceUpdate(BaseModel):
    value: Any


class PreferenceResponse(BaseModel):
    key: str
    value: Any

    class Config:
        from_attributes = True


class PreferencesDictResponse(BaseModel):
    """Response model for preferences dictionary"""
    # Use a flexible model that accepts any key-value pairs
    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {
                "theme": "dark",
                "language": "en",
                "email_notifications": True
            }
        }


@router.get("/preferences", tags=["user-preferences"])
async def get_all_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Get all preferences for the current user"""
    try:
        service = UserPreferenceService(db)
        preferences = await service.get_all_preferences(current_user.id)
        
        if not preferences:
            # Convert to JSONResponse for slowapi compatibility
            return JSONResponse(
                content={},
                status_code=200
            )
        
        # Clean all preference values to ensure JSON serialization
        cleaned_preferences = {
            key: clean_preference_value(value) 
            for key, value in preferences.items()
        }
        
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=cleaned_preferences,
            status_code=200
        )
    except (ProgrammingError, OperationalError) as e:
        # Table doesn't exist yet - return empty dict
        logger.warning(f"Table user_preferences may not exist yet: {e}")
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content={},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting preferences: {e}", exc_info=True)
        # Return empty dict if there's an error (e.g., table doesn't exist yet)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content={},
            status_code=200
        )


@router.get("/preferences/{key}", tags=["user-preferences"])
async def get_preference(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Get a specific preference for the current user"""
    try:
        service = UserPreferenceService(db)
        preference = await service.get_preference(current_user.id, key)
        if not preference:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preference not found"
            )
        # Clean the preference value to ensure JSON serialization
        cleaned_value = clean_preference_value(preference.value)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content={"key": preference.key, "value": cleaned_value},
            status_code=200
        )
    except HTTPException:
        raise
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error getting preference {key}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )


@router.put("/preferences/{key}", tags=["user-preferences"])
async def set_preference(
    key: str,
    preference_data: PreferenceUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Set a preference for the current user"""
    try:
        service = UserPreferenceService(db)
        preference = await service.set_preference(
            current_user.id,
            key,
            preference_data.value
        )
        # Clean the preference value to ensure JSON serialization
        cleaned_value = clean_preference_value(preference.value)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content={"key": preference.key, "value": cleaned_value},
            status_code=200
        )
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error setting preference {key}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preference"
        )


@router.put("/preferences", tags=["user-preferences"])
async def set_preferences(
    preferences: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Set multiple preferences at once"""
    try:
        service = UserPreferenceService(db)
        await service.set_preferences(current_user.id, preferences)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content={"success": True, "message": "Preferences updated successfully"},
            status_code=200
        )
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error setting preferences: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )


@router.delete("/preferences/{key}", tags=["user-preferences"])
async def delete_preference(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete a specific preference"""
    service = UserPreferenceService(db)
    success = await service.delete_preference(current_user.id, key)
    if success:
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content={"success": True, "message": "Preference deleted successfully"},
            status_code=200
        )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Preference not found"
    )


@router.delete("/preferences", tags=["user-preferences"])
async def delete_all_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Delete all preferences for the current user"""
    service = UserPreferenceService(db)
    count = await service.delete_all_preferences(current_user.id)
    # Convert to JSONResponse for slowapi compatibility
    return JSONResponse(
        content={"success": True, "message": f"Deleted {count} preferences"},
        status_code=200
    )


@router.get("/preferences/notifications", tags=["user-preferences"])
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Get notification preferences for the current user"""
    try:
        service = UserPreferenceService(db)
        preference = await service.get_preference(current_user.id, "notifications")
        if not preference:
            # Return default notification preferences if none exist
            default_preferences = {
                "email": {
                    "enabled": True,
                    "frequency": "instant",
                    "types": {
                        "marketing": False,
                        "product": True,
                        "security": True,
                        "billing": True,
                        "system": True,
                    },
                },
                "push": {
                    "enabled": False,
                    "types": {
                        "marketing": False,
                        "product": True,
                        "security": True,
                        "billing": False,
                        "system": False,
                    },
                },
                "inApp": {
                    "enabled": True,
                    "types": {
                        "marketing": False,
                        "product": True,
                        "security": True,
                        "billing": True,
                        "system": True,
                    },
                },
            }
            return JSONResponse(
                content={"key": "notifications", "value": default_preferences},
                status_code=200
            )
        # Clean the preference value to ensure JSON serialization
        cleaned_value = clean_preference_value(preference.value)
        return JSONResponse(
            content={"key": preference.key, "value": cleaned_value},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting notification preferences: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notification preferences"
        )


@router.put("/preferences/notifications", tags=["user-preferences"])
async def update_notification_preferences(
    preference_data: PreferenceUpdate = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Update notification preferences for the current user"""
    try:
        service = UserPreferenceService(db)
        preference = await service.set_preference(
            current_user.id,
            "notifications",
            preference_data.value
        )
        # Clean the preference value to ensure JSON serialization
        cleaned_value = clean_preference_value(preference.value)
        return JSONResponse(
            content={"key": preference.key, "value": cleaned_value},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error updating notification preferences: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification preferences"
        )




