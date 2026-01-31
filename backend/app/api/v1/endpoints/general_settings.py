"""
General Settings Endpoints
Manage general application settings for users (language, timezone, theme, etc.)
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.rate_limit import rate_limit_decorator
from app.models.user import User
from app.services.user_preference_service import UserPreferenceService
from app.dependencies import get_current_user

router = APIRouter()

# Preference key for general settings
GENERAL_SETTINGS_KEY = "general_settings"


class GeneralSettingsData(BaseModel):
    """General Settings schema"""
    language: str = Field(default="en", max_length=10, description="Language code")
    timezone: str = Field(default="UTC", max_length=100, description="Timezone")
    theme: str = Field(default="system", description="Theme preference (light, dark, system)")
    dateFormat: str = Field(default="YYYY-MM-DD", max_length=20, description="Date format")
    timeFormat: str = Field(default="24h", description="Time format (12h or 24h)")
    weekStartsOn: Optional[str] = Field(default="monday", description="Week starts on (monday or sunday)")
    enableNotifications: Optional[bool] = Field(default=True, description="Enable notifications")
    enableEmailNotifications: Optional[bool] = Field(default=True, description="Enable email notifications")


class GeneralSettingsResponse(BaseModel):
    """General Settings response schema"""
    language: str
    timezone: str
    theme: str
    dateFormat: str
    timeFormat: str
    weekStartsOn: Optional[str] = None
    enableNotifications: Optional[bool] = None
    enableEmailNotifications: Optional[bool] = None


@router.get("/", response_model=GeneralSettingsResponse, tags=["general-settings"])
@rate_limit_decorator("30/minute")
async def get_general_settings(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get general settings for the current user"""
    from app.core.logging import logger
    
    try:
        service = UserPreferenceService(db)
        settings_data = await service.get_preference(current_user.id, GENERAL_SETTINGS_KEY)
        
        if settings_data and settings_data.value is not None:
            try:
                # Ensure value is a dict
                if isinstance(settings_data.value, dict):
                    # Clean the dict to ensure all values are JSON-serializable
                    cleaned_value = {}
                    for key, val in settings_data.value.items():
                        # Skip non-serializable types (like datetime objects)
                        if isinstance(val, (str, int, float, bool, type(None))):
                            cleaned_value[key] = val
                        elif isinstance(val, dict):
                            # Recursively clean nested dicts
                            cleaned_value[key] = {
                                k: v for k, v in val.items() 
                                if isinstance(v, (str, int, float, bool, type(None)))
                            }
                        # Skip other types (datetime, etc.)
                    
                    # Try to create GeneralSettingsResponse from cleaned value
                    try:
                        # Use model_validate to safely create the model
                        settings_obj = GeneralSettingsData.model_validate(cleaned_value)
                        response = GeneralSettingsResponse(**settings_obj.model_dump())
                        # Convert to JSONResponse for slowapi compatibility
                        return JSONResponse(
                            content=response.model_dump(exclude_none=True),
                            status_code=200
                        )
                    except Exception as validation_error:
                        logger.warning(f"Validation error for general settings, using defaults: {validation_error}")
                        # Fall through to return defaults
                else:
                    logger.warning(f"General settings value is not a dict, type: {type(settings_data.value)}")
            except Exception as parse_error:
                logger.error(f"Error parsing general settings value: {parse_error}", exc_info=True)
                # Fall through to return defaults
        
        # Return default settings
        default_settings = GeneralSettingsData()
        response = GeneralSettingsResponse(**default_settings.model_dump(exclude_none=True))
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=response.model_dump(exclude_none=True),
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting general settings: {e}", exc_info=True)
        # Return default settings on error
        default_settings = GeneralSettingsData()
        response = GeneralSettingsResponse(**default_settings.model_dump(exclude_none=True))
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=response.model_dump(exclude_none=True),
            status_code=200
        )


@router.put("/", response_model=GeneralSettingsResponse, tags=["general-settings"])
@rate_limit_decorator("20/minute")
async def update_general_settings(
    request: Request,
    settings: GeneralSettingsData = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update general settings for the current user"""
    from app.core.logging import logger
    
    try:
        service = UserPreferenceService(db)
        
        # Convert to dict for storage
        settings_dict = settings.model_dump(exclude_none=True)
        
        # Save settings
        preference = await service.set_preference(
            current_user.id,
            GENERAL_SETTINGS_KEY,
            settings_dict
        )
        
        # Ensure value is a dict and safely create response
        if isinstance(preference.value, dict):
            try:
                # Clean the dict to ensure all values are JSON-serializable
                cleaned_value = {}
                for key, val in preference.value.items():
                    if isinstance(val, (str, int, float, bool, type(None))):
                        cleaned_value[key] = val
                    elif isinstance(val, dict):
                        cleaned_value[key] = {
                            k: v for k, v in val.items() 
                            if isinstance(v, (str, int, float, bool, type(None)))
                        }
                
                # Use model_validate to safely create the model
                settings_obj = GeneralSettingsData.model_validate(cleaned_value)
                response = GeneralSettingsResponse(**settings_obj.model_dump(exclude_none=True))
                # Convert to JSONResponse for slowapi compatibility
                return JSONResponse(
                    content=response.model_dump(exclude_none=True),
                    status_code=200
                )
            except Exception as e:
                logger.warning(f"Error parsing saved preference value, using provided settings: {e}")
                # Fallback to provided settings if preference value is invalid
                response = GeneralSettingsResponse(**settings.model_dump(exclude_none=True))
                # Convert to JSONResponse for slowapi compatibility
                return JSONResponse(
                    content=response.model_dump(exclude_none=True),
                    status_code=200
                )
        else:
            # Fallback to provided settings if preference value is invalid
            response = GeneralSettingsResponse(**settings.model_dump(exclude_none=True))
            # Convert to JSONResponse for slowapi compatibility
            return JSONResponse(
                content=response.model_dump(exclude_none=True),
                status_code=200
            )
    except Exception as e:
        logger.error(f"Error updating general settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update general settings"
        )
