"""
API endpoints for theme management.
"""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from pydantic import BaseModel, Field
import json
from app.schemas.theme import (
    ThemeCreate,
    ThemeUpdate,
    ThemeResponse,
    ThemeListResponse,
    ThemeConfigResponse
)
from app.models.theme import Theme
from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.dependencies import get_current_user, require_superadmin

router = APIRouter()


class ThemeModeUpdate(BaseModel):
    """Schema for updating theme mode (light/dark/system)"""
    mode: str = Field(..., description="Theme mode: 'light', 'dark', or 'system'")
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.mode not in ['light', 'dark', 'system']:
            raise ValueError("Mode must be 'light', 'dark', or 'system'")


async def ensure_default_theme(db: AsyncSession, created_by: int = 1) -> Theme:
    """
    Ensure TemplateTheme (ID 32) exists. Creates one if none exists.
    Always creates TemplateTheme if it doesn't exist, regardless of other themes.
    Also updates existing theme to include comprehensive config if missing.
    Returns the TemplateTheme (or newly created one).
    """
    from app.core.theme_defaults import DEFAULT_THEME_CONFIG
    
    # Check if TemplateTheme exists (ID 32)
    result = await db.execute(select(Theme).where(Theme.id == 32))
    template_theme = result.scalar_one_or_none()
    
    if template_theme:
        # TemplateTheme exists - check if it needs updating with comprehensive config
        current_config = template_theme.config or {}
        needs_update = False
        
        # Check if comprehensive fields are missing
        if "typography" not in current_config or "colors" not in current_config or "spacing" not in current_config:
            needs_update = True
        
        if needs_update:
            # Merge existing config with comprehensive defaults
            new_config = DEFAULT_THEME_CONFIG.copy()
            
            # Preserve existing values
            if "mode" in current_config:
                new_config["mode"] = current_config["mode"]
            
            # Preserve basic colors if they exist
            for color_key in ["primary_color", "secondary_color", "danger_color", "warning_color", "info_color", "success_color"]:
                if color_key in current_config:
                    new_config[color_key] = current_config[color_key]
                # Also check old format
                elif color_key.replace("_color", "") in current_config:
                    new_config[color_key] = current_config[color_key.replace("_color", "")]
            
            if "font_family" in current_config:
                new_config["font_family"] = current_config["font_family"]
            if "border_radius" in current_config:
                new_config["border_radius"] = current_config["border_radius"]
            
            # Preserve existing nested structures if they exist
            if "typography" in current_config:
                new_config["typography"] = {**new_config.get("typography", {}), **current_config["typography"]}
            if "colors" in current_config:
                new_config["colors"] = {**new_config.get("colors", {}), **current_config["colors"]}
            if "spacing" in current_config:
                new_config["spacing"] = {**new_config.get("spacing", {}), **current_config["spacing"]}
            if "borderRadius" in current_config:
                new_config["borderRadius"] = {**new_config.get("borderRadius", {}), **current_config["borderRadius"]}
            if "shadow" in current_config:
                new_config["shadow"] = {**new_config.get("shadow", {}), **current_config["shadow"]}
            if "effects" in current_config:
                new_config["effects"] = {**new_config.get("effects", {}), **current_config["effects"]}
            
            # Preserve any other custom fields
            for key, value in current_config.items():
                if key not in new_config and key not in ["primary", "secondary", "danger", "warning", "info"]:
                    new_config[key] = value
            
            # Update the theme
            template_theme.config = new_config
            await db.commit()
            await db.refresh(template_theme)
        
        # If no theme is active, activate TemplateTheme
        active_result = await db.execute(select(Theme).where(Theme.is_active == True))
        active_theme = active_result.scalar_one_or_none()
        if not active_theme:
            template_theme.is_active = True
            await db.commit()
            await db.refresh(template_theme)
        return template_theme
    
    # TemplateTheme doesn't exist - create it with ID 32
    # This should always happen regardless of other themes existing
    from app.core.theme_defaults import DEFAULT_THEME_CONFIG
    default_config = DEFAULT_THEME_CONFIG.copy()
    
    # Check if any theme is currently active
    active_result = await db.execute(select(Theme).where(Theme.is_active == True))
    active_theme = active_result.scalar_one_or_none()
    
    # Create TemplateTheme - activate it only if no other theme is active
    is_active = active_theme is None
    
    # Use SQLAlchemy ORM to create the theme (works properly with asyncpg)
    template_theme = Theme(
        id=32,
        name='TemplateTheme',
        display_name='Template Theme',
        description='Master theme that controls all components',
        config=default_config,  # SQLAlchemy will handle JSON serialization
        is_active=is_active,
        created_by=created_by
    )
    db.add(template_theme)
    await db.commit()
    await db.refresh(template_theme)
    return template_theme


@router.get("/active", response_model=ThemeConfigResponse, tags=["themes"])
async def get_active_theme(db: AsyncSession = Depends(get_db)):
    """
    Get the currently active theme configuration.
    Public endpoint - no authentication required.
    Returns the global theme that applies to all users.
    Creates a default theme if none exists.
    Note: Cache disabled to ensure theme is always created in DB when needed.
    """
    result = await db.execute(select(Theme).where(Theme.is_active == True))
    theme = result.scalar_one_or_none()
    
    if not theme:
        # Try to ensure a default theme exists in the database
        try:
            theme = await ensure_default_theme(db, created_by=1)
            # Invalidate cache to ensure fresh data
            invalidate_cache_pattern("theme:*")
            invalidate_cache_pattern("themes:*")
        except Exception as e:
            # If we can't create a theme, return a default response
            # This should rarely happen, but handle gracefully
            from app.core.theme_defaults import DEFAULT_THEME_CONFIG
            default_config = DEFAULT_THEME_CONFIG.copy()
            return ThemeConfigResponse(
                id=32,  # Virtual theme ID (TemplateTheme)
                name="TemplateTheme",
                display_name="Template Theme",
                config=default_config,
                updated_at=datetime.now()
            )
    
    # Ensure config has a mode field
    config = theme.config or {}
    if "mode" not in config:
        config["mode"] = "system"
        theme.config = config
        await db.commit()
        await db.refresh(theme)
    
    return ThemeConfigResponse(
        id=theme.id,
        name=theme.name,
        display_name=theme.display_name,
        config=config,
        updated_at=theme.updated_at
    )


@router.get("", response_model=ThemeListResponse, tags=["themes"])
async def list_themes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    List all themes.
    Requires superadmin authentication.
    TemplateTheme (ID 32) is ALWAYS included in the list, regardless of pagination.
    Note: Cache disabled to ensure fresh data when themes are created/updated.
    """
    # Delete any "default" theme that might still exist (cleanup)
    # This ensures the theme is removed even if migration hasn't run yet
    try:
        await db.execute(text("DELETE FROM themes WHERE id = 0 OR name = 'default' OR display_name = 'Default Theme'"))
        await db.commit()
    except Exception:
        # Ignore errors - migration should handle this, but we try anyway
        await db.rollback()
    
    # Optimized: Get total count first (without loading all objects)
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count()).select_from(Theme).where(
            (Theme.id != 0) & 
            (Theme.name != 'default') &
            (Theme.display_name != 'Default Theme')
        )
    )
    total_count = count_result.scalar_one() or 0
    
    # Get paginated themes from database (optimized: pagination at SQL level)
    all_themes_result = await db.execute(
        select(Theme).where(
            (Theme.id != 0) & 
            (Theme.name != 'default') &
            (Theme.display_name != 'Default Theme')
        ).order_by(Theme.id)
        .offset(skip)
        .limit(limit)
    )
    themes_list = list(all_themes_result.scalars().all())
    
    # Get active theme
    active_result = await db.execute(select(Theme).where(Theme.is_active == True))
    active_theme = active_result.scalar_one_or_none()
    
    # If no active theme, activate TemplateTheme (ID 32) if it exists
    if not active_theme:
        # Check if TemplateTheme (ID 32) exists
        template_result = await db.execute(select(Theme).where(Theme.id == 32))
        template_theme = template_result.scalar_one_or_none()
        
        if template_theme:
            template_theme.is_active = True
            await db.commit()
            await db.refresh(template_theme)
            active_theme = template_theme
        elif themes_list:
            # Fallback to first theme if TemplateTheme doesn't exist (shouldn't happen)
            first_theme = themes_list[0]
            first_theme.is_active = True
            await db.commit()
            await db.refresh(first_theme)
            active_theme = first_theme
        
        # Invalidate cache after activating theme
        from app.core.cache import invalidate_cache_pattern
        invalidate_cache_pattern("themes:*")
        invalidate_cache_pattern("theme:*")
    
    # Convert themes to response format with error handling
    try:
        theme_responses = [ThemeResponse.model_validate(theme) for theme in themes_list]
    except Exception as e:
        from app.core.logging import logger
        logger.error(f"Error validating theme responses: {e}", exc_info=True)
        # Fallback: create minimal responses
        theme_responses = []
        for theme in themes_list:
            try:
                theme_responses.append(ThemeResponse.model_validate(theme))
            except Exception as theme_error:
                logger.error(f"Error validating theme {theme.id}: {theme_error}", exc_info=True)
                # Skip this theme if validation fails
                continue
    
    return ThemeListResponse(
        themes=theme_responses,
        total=total_count,
        active_theme_id=active_theme.id if active_theme else None
    )


@router.get("/{theme_id}", response_model=ThemeResponse, tags=["themes"])
@cached(expire=600, key_prefix="theme")  # Cache 10min
async def get_theme(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get a specific theme by ID.
    Requires superadmin authentication.
    """
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    return ThemeResponse.model_validate(theme)


@router.post("", response_model=ThemeResponse, status_code=status.HTTP_201_CREATED, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def create_theme(
    theme_data: ThemeCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Create a new theme.
    Requires superadmin authentication.
    If is_active=True, automatically deactivates all other themes.
    """
    # Check if theme name already exists
    result = await db.execute(select(Theme).where(Theme.name == theme_data.name))
    existing_theme = result.scalar_one_or_none()
    if existing_theme:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Theme with name '{theme_data.name}' already exists"
        )
    
    # If activating, deactivate all others
    if theme_data.is_active:
        from sqlalchemy import update
        await db.execute(update(Theme).where(Theme.is_active == True).values(is_active=False))
        await db.commit()
    
    theme = Theme(
        name=theme_data.name,
        display_name=theme_data.display_name,
        description=theme_data.description,
        config=theme_data.config,
        is_active=theme_data.is_active or False,
        created_by=current_user.id
    )
    db.add(theme)
    await db.commit()
    await db.refresh(theme)
    return ThemeResponse.model_validate(theme)


@router.put("/{theme_id}", response_model=ThemeResponse, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def update_theme(
    theme_id: int,
    theme_data: ThemeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Update an existing theme.
    Requires superadmin authentication.
    If is_active=True, automatically deactivates all other themes.
    TemplateTheme (ID 32) and TemplateTheme2 (ID 33) can be updated but their names cannot be changed.
    """
    # Prevent modification of TemplateTheme name (ID 32)
    if theme_id == 32:
        # Allow config updates but prevent name/display_name changes
        if theme_data.display_name is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify display_name of TemplateTheme (ID 32). Only config can be updated."
            )
    
    # Prevent modification of TemplateTheme2 name (ID 33)
    if theme_id == 33:
        # Allow config updates but prevent name/display_name changes
        if theme_data.display_name is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify display_name of TemplateTheme2 (ID 33). Only config can be updated."
            )
    
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    # If activating, deactivate all others
    if theme_data.is_active is True:
        from sqlalchemy import update
        await db.execute(update(Theme).where(Theme.is_active == True, Theme.id != theme_id).values(is_active=False))
        await db.commit()
    
    # Update fields
    if theme_data.display_name is not None:
        theme.display_name = theme_data.display_name
    if theme_data.description is not None:
        theme.description = theme_data.description
    if theme_data.config is not None:
        theme.config = theme_data.config
    if theme_data.is_active is not None:
        theme.is_active = theme_data.is_active
    
    await db.commit()
    await db.refresh(theme)
    return ThemeResponse.model_validate(theme)


@router.post("/{theme_id}/activate", response_model=ThemeResponse, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def activate_theme(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Activate a theme (deactivates all others).
    Requires superadmin authentication.
    """
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    # Deactivate all themes
    from sqlalchemy import update
    await db.execute(update(Theme).where(Theme.is_active == True, Theme.id != theme_id).values(is_active=False))
    await db.commit()
    
    # Activate this theme
    theme.is_active = True
    await db.commit()
    await db.refresh(theme)
    return ThemeResponse.model_validate(theme)


@router.put("/active/mode", response_model=ThemeConfigResponse, tags=["themes"])
@invalidate_cache_pattern("theme:*")
async def update_active_theme_mode(
    mode_update: ThemeModeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Update the mode (light/dark/system) of the currently active theme.
    Requires superadmin authentication.
    This affects all users globally.
    Creates a default theme if none exists.
    """
    result = await db.execute(select(Theme).where(Theme.is_active == True))
    theme = result.scalar_one_or_none()
    
    if not theme:
        # Create or activate a default theme
        theme = await ensure_default_theme(db, created_by=current_user.id)
    
    # Update the mode in config
    config = theme.config or {}
    config["mode"] = mode_update.mode
    theme.config = config
    
    await db.commit()
    await db.refresh(theme)
    
    return ThemeConfigResponse(
        name=theme.name,
        display_name=theme.display_name,
        config=config,
        updated_at=theme.updated_at
    )


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["themes"])
@invalidate_cache_pattern("themes:*")
@invalidate_cache_pattern("theme:*")
async def delete_theme(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Delete a theme.
    Requires superadmin authentication.
    Cannot delete the active theme.
    Cannot delete TemplateTheme (ID 32) or TemplateTheme2 (ID 33).
    """
    # Prevent deletion of TemplateTheme (ID 32)
    if theme_id == 32:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete TemplateTheme (ID 32). This is a protected system theme."
        )
    
    # Prevent deletion of TemplateTheme2 (ID 33)
    if theme_id == 33:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete TemplateTheme2 (ID 33). This is a protected system theme."
        )
    
    result = await db.execute(select(Theme).where(Theme.id == theme_id))
    theme = result.scalar_one_or_none()
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Theme with ID {theme_id} not found"
        )
    
    # Prevent deletion of active theme
    if theme.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the active theme. Please activate another theme first."
        )
    
    await db.delete(theme)
    await db.commit()

