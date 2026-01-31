"""
Organization Settings Endpoints
Manage organization-level settings for users
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

# Preference key for organization settings
ORGANIZATION_SETTINGS_KEY = "organization_settings"


class AddressData(BaseModel):
    """Address schema"""
    line1: str = Field(..., max_length=200, description="Address line 1")
    line2: Optional[str] = Field(None, max_length=200, description="Address line 2")
    city: str = Field(..., max_length=100, description="City")
    state: str = Field(..., max_length=100, description="State/Province")
    postalCode: str = Field(..., max_length=20, description="Postal code")
    country: str = Field(..., max_length=100, description="Country")


class OrganizationSettingsData(BaseModel):
    """Organization Settings schema"""
    name: str = Field(..., min_length=1, max_length=200, description="Organization name")
    slug: str = Field(..., min_length=1, max_length=200, description="Organization slug")
    email: Optional[str] = Field(None, max_length=255, description="Organization email")
    phone: Optional[str] = Field(None, max_length=50, description="Organization phone")
    website: Optional[str] = Field(None, max_length=500, description="Organization website")
    address: Optional[AddressData] = Field(None, description="Organization address")
    timezone: Optional[str] = Field(default="UTC", max_length=50, description="Timezone")
    locale: Optional[str] = Field(default="en-US", max_length=10, description="Locale")
    
    @field_validator('website')
    @classmethod
    def validate_website(cls, v: Optional[str]) -> Optional[str]:
        """Validate website URL format"""
        if v is None or v == "":
            return None
        v = v.strip()
        if v and not (v.startswith('http://') or v.startswith('https://')):
            # Auto-add https:// if no protocol
            v = f'https://{v}'
        return v
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        """Validate email format"""
        if v is None or v == "":
            return None
        v = v.strip()
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v


class OrganizationSettingsResponse(BaseModel):
    """Organization Settings response schema"""
    settings: OrganizationSettingsData


@router.get("/", response_model=OrganizationSettingsResponse, tags=["organization-settings"])
@rate_limit_decorator("30/minute")
async def get_organization_settings(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get organization settings for the current user"""
    from app.core.logging import logger
    
    try:
        service = UserPreferenceService(db)
        settings_data = await service.get_preference(current_user.id, ORGANIZATION_SETTINGS_KEY)
        
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
                    
                    # Try to create OrganizationSettingsData from cleaned value
                    try:
                        # Use model_validate to safely create the model
                        settings_obj = OrganizationSettingsData.model_validate(cleaned_value)
                        response = OrganizationSettingsResponse(settings=settings_obj)
                        # Convert to JSONResponse for slowapi compatibility
                        return JSONResponse(
                            content=response.model_dump(),
                            status_code=200
                        )
                    except Exception as validation_error:
                        logger.warning(f"Validation error for organization settings, using defaults: {validation_error}")
                        # Fall through to return defaults
                else:
                    logger.warning(f"Organization settings value is not a dict, type: {type(settings_data.value)}")
            except Exception as parse_error:
                logger.error(f"Error parsing organization settings value: {parse_error}", exc_info=True)
                # Fall through to return defaults
        
        # Return default settings (empty but valid)
        # Note: We need at least name and slug, so we'll return an error or use user's email as default name
        default_name = current_user.email.split('@')[0] if current_user.email else "My Organization"
        default_slug = default_name.lower().replace(' ', '-')
        default_settings = OrganizationSettingsData(
            name=default_name,
            slug=default_slug,
            timezone="UTC",
            locale="en-US"
        )
        response = OrganizationSettingsResponse(settings=default_settings)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=response.model_dump(),
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error getting organization settings: {e}", exc_info=True)
        # Return default settings on error
        default_name = current_user.email.split('@')[0] if current_user.email else "My Organization"
        default_slug = default_name.lower().replace(' ', '-')
        default_settings = OrganizationSettingsData(
            name=default_name,
            slug=default_slug,
            timezone="UTC",
            locale="en-US"
        )
        response = OrganizationSettingsResponse(settings=default_settings)
        # Convert to JSONResponse for slowapi compatibility
        return JSONResponse(
            content=response.model_dump(),
            status_code=200
        )


@router.put("/", response_model=OrganizationSettingsResponse, tags=["organization-settings"])
@rate_limit_decorator("20/minute")
async def update_organization_settings(
    request: Request,
    settings: OrganizationSettingsData = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update organization settings for the current user"""
    from app.core.logging import logger
    
    try:
        service = UserPreferenceService(db)
        
        # Convert to dict for storage
        settings_dict = settings.model_dump(exclude_none=True)
        
        # Save settings
        preference = await service.set_preference(
            current_user.id,
            ORGANIZATION_SETTINGS_KEY,
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
                settings_obj = OrganizationSettingsData.model_validate(cleaned_value)
                response = OrganizationSettingsResponse(settings=settings_obj)
                # Convert to JSONResponse for slowapi compatibility
                return JSONResponse(
                    content=response.model_dump(),
                    status_code=200
                )
            except Exception as e:
                logger.warning(f"Error parsing saved preference value, using provided settings: {e}")
                # Fallback to provided settings if preference value is invalid
                response = OrganizationSettingsResponse(settings=settings)
                # Convert to JSONResponse for slowapi compatibility
                return JSONResponse(
                    content=response.model_dump(),
                    status_code=200
                )
        else:
            # Fallback to provided settings if preference value is invalid
            response = OrganizationSettingsResponse(settings=settings)
            # Convert to JSONResponse for slowapi compatibility
            return JSONResponse(
                content=response.model_dump(),
                status_code=200
            )
    except Exception as e:
        logger.error(f"Error updating organization settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization settings"
        )

