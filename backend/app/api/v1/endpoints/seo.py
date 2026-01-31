"""
SEO API Endpoints
SEO settings management
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user_preference import UserPreference
from app.models.user import User
from app.dependencies import get_current_user, get_db

router = APIRouter()


class SEOSettings(BaseModel):
    title: Optional[str] = Field(None, max_length=60)
    description: Optional[str] = Field(None, max_length=160)
    keywords: Optional[str] = None
    canonical_url: Optional[str] = None
    robots: Optional[str] = Field(default='index, follow')
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None
    og_type: Optional[str] = Field(default='website')
    twitter_card: Optional[str] = Field(default='summary_large_image')
    twitter_title: Optional[str] = None
    twitter_description: Optional[str] = None
    twitter_image: Optional[str] = None
    schema: Optional[str] = None


class SEOSettingsResponse(BaseModel):
    settings: dict

    class Config:
        from_attributes = True


@router.get("/seo/settings", response_model=SEOSettingsResponse, tags=["seo"])
async def get_seo_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get SEO settings"""
    result = await db.execute(
        select(UserPreference)
        .where(UserPreference.user_id == current_user.id)
        .where(UserPreference.key == 'seo_settings')
    )
    preference = result.scalar_one_or_none()
    
    if preference:
        return SEOSettingsResponse(settings=preference.value if isinstance(preference.value, dict) else {})
    
    return SEOSettingsResponse(settings={})


@router.put("/seo/settings", response_model=SEOSettingsResponse, tags=["seo"])
async def update_seo_settings(
    settings: SEOSettings,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update SEO settings"""
    settings_dict = settings.model_dump(exclude_none=True)
    
    result = await db.execute(
        select(UserPreference)
        .where(UserPreference.user_id == current_user.id)
        .where(UserPreference.key == 'seo_settings')
    )
    preference = result.scalar_one_or_none()
    
    if preference:
        preference.value = settings_dict
    else:
        preference = UserPreference(
            user_id=current_user.id,
            key='seo_settings',
            value=settings_dict,
        )
        db.add(preference)
    
    await db.commit()
    await db.refresh(preference)
    
    return SEOSettingsResponse(settings=preference.value if isinstance(preference.value, dict) else {})


