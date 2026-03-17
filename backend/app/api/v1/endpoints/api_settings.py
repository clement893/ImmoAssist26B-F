"""
API Settings Endpoints
Manage API configuration settings for users
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, field_validator

from app.core.database import get_db
from app.core.rate_limit import rate_limit_decorator
from app.models.user import User
from app.services.user_preference_service import UserPreferenceService
from app.dependencies import get_current_user

router = APIRouter()

# Preference key for API settings
API_SETTINGS_KEY = "api_settings"


class APISettingsData(BaseModel):
    """API Settings schema"""
    base_url: Optional[str] = Field(None, max_length=500, description="API base URL")
    rate_limit: int = Field(default=1000, ge=1, le=100000, description="Rate limit per minute")
    enable_webhooks: bool = Field(default=False, description="Enable webhooks")
    webhook_url: Optional[str] = Field(None, max_length=500, description="Webhook URL")
    enable_logging: bool = Field(default=True, description="Enable API logging")
    
    @field_validator('base_url', 'webhook_url')
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate URL format"""
        if v is None or v == "":
            return None
        v = v.strip()
        if v and not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class APISettingsResponse(BaseModel):
    """API Settings response schema"""
    settings: APISettingsData


@router.get("/", response_model=APISettingsResponse, tags=["api-settings"])
@rate_limit_decorator("30/minute")
async def get_api_settings(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get API settings for the current user"""
    from app.core.logging import logger
    
    try:
        service = UserPreferenceService(db)
        settings_data = await service.get_preference(current_user.id, API_SETTINGS_KEY)
        
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
                    
                    # Try to create APISettingsData from cleaned value
                    try:
                        # Use model_validate to safely create the model
                        settings_obj = APISettingsData.model_validate(cleaned_value)
                        response = APISettingsResponse(settings=settings_obj)
                        # Convert to JSONResponse for slowapi compatibility
                        return JSONResponse(
                            content=response.model_dump(),
                            status_code=200
                        )
                    except Exception as validation_error:
                        logger.warning(f"Validation error for API settings, using defaults: {validation_error}")
                        # Fall through to return defaults
                else:
                    logger.warning(f"API settings value is not a dict, type: {type(settings_data.value)}")
            except Exception as parse_error:
                logger.error(f"Error parsing API settings value: {parse_error}", exc_info=True)
                # Fall through to return defaults
        
        # Return default settings
        default_settings = APISettingsData()
        response = APISettingsResponse(settings=default_settings)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=response.model_dump(),
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting API settings: {e}", exc_info=True)
        # Return default settings on error
        default_settings = APISettingsData()
        response = APISettingsResponse(settings=default_settings)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=response.model_dump(),
            status_code=200
        )


@router.put("/", response_model=APISettingsResponse, tags=["api-settings"])
@rate_limit_decorator("20/minute")
async def update_api_settings(
    request: Request,
    settings: APISettingsData = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update API settings for the current user"""
    try:
        service = UserPreferenceService(db)
        
        # Convert to dict for storage
        settings_dict = settings.model_dump(exclude_none=True)
        
        # Save settings
        preference = await service.set_preference(
            current_user.id,
            API_SETTINGS_KEY,
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
                settings_obj = APISettingsData.model_validate(cleaned_value)
                response = APISettingsResponse(settings=settings_obj)
                # Convert to JSONResponse for slowapi compatibility
                return JSONResponse(
                    content=response.model_dump(),
                    status_code=200
                )
            except Exception as e:
                logger.warning(f"Error parsing saved preference value, using provided settings: {e}")
                # Fallback to provided settings if preference value is invalid
                response = APISettingsResponse(settings=settings)
                # Convert to JSONResponse for slowapi compatibility
                return JSONResponse(
                    content=response.model_dump(),
                    status_code=200
                )
        else:
            # Fallback to provided settings if preference value is invalid
            response = APISettingsResponse(settings=settings)
            # Convert to JSONResponse for slowapi compatibility
            return JSONResponse(
                content=response.model_dump(),
                status_code=200
            )
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error updating API settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update API settings"
        )

