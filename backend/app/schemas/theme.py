"""
Pydantic schemas for Theme API endpoints.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from app.core.theme_validation import validate_theme_config


class ThemeBase(BaseModel):
    """Base schema for Theme."""
    name: str = Field(..., min_length=1, max_length=100, description="Unique theme identifier")
    display_name: str = Field(..., min_length=1, max_length=200, description="Display name for the theme")
    description: Optional[str] = Field(None, description="Theme description")
    config: Dict[str, Any] = Field(default_factory=dict, description="Theme configuration (CSS variables, colors, etc.)")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate theme name format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Theme name must contain only alphanumeric characters, hyphens, and underscores')
        return v.lower()
    
    @validator('config')
    def validate_config(cls, v):
        """
        Validate theme configuration.
        Checks color formats and contrast compliance (WCAG AA).
        """
        if not v or not isinstance(v, dict):
            return v
        
        # Validate theme config (non-strict mode - allows warnings but blocks critical errors)
        is_valid, color_errors, contrast_issues = validate_theme_config(v, strict_contrast=False)
        
        # Build error message if validation fails
        if not is_valid:
            error_parts = []
            
            if color_errors:
                error_parts.append("Color format errors:")
                for error in color_errors:
                    error_parts.append(f"  - {error['field']}: {error['message']}")
            
            # Contrast issues are now warnings only (non-blocking)
            # Don't include them in error message - they're just warnings
            # User can choose to ignore them
            
            if error_parts:
                raise ValueError('\n'.join(error_parts))
        
        return v


class ThemeCreate(ThemeBase):
    """Schema for creating a new theme."""
    is_active: Optional[bool] = Field(False, description="Whether this theme should be activated immediately")


class ThemeUpdate(BaseModel):
    """Schema for updating an existing theme."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    
    @validator('config')
    def validate_config(cls, v):
        """
        Validate theme configuration.
        Checks color formats and contrast compliance (WCAG AA).
        Only validates if config is provided (not None).
        """
        if v is None or not isinstance(v, dict):
            return v
        
        # Validate theme config (non-strict mode - allows warnings but blocks critical errors)
        is_valid, color_errors, contrast_issues = validate_theme_config(v, strict_contrast=False)
        
        # Build error message if validation fails
        if not is_valid:
            error_parts = []
            
            if color_errors:
                error_parts.append("Color format errors:")
                for error in color_errors:
                    error_parts.append(f"  - {error['field']}: {error['message']}")
            
            # Contrast issues are now warnings only (non-blocking)
            # Don't include them in error message - they're just warnings
            # User can choose to ignore them
            
            if error_parts:
                raise ValueError('\n'.join(error_parts))
        
        return v


class ThemeResponse(ThemeBase):
    """Schema for theme response."""
    id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ThemeListResponse(BaseModel):
    """Schema for theme list response."""
    themes: list[ThemeResponse]
    total: int
    active_theme_id: Optional[int] = None


class ThemeConfigResponse(BaseModel):
    """Schema for active theme configuration (public endpoint)."""
    id: int = Field(..., description="Theme ID")
    name: str
    display_name: str
    config: Dict[str, Any]
    updated_at: datetime
    
    class Config:
        from_attributes = True


