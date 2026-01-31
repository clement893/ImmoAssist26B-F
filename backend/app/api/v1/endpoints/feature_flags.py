"""
Feature Flags API Endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.feature_flag_service import FeatureFlagService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


class FeatureFlagCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100, description="Unique flag key")
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    enabled: bool = Field(False)
    rollout_percentage: float = Field(0.0, ge=0.0, le=100.0)
    target_users: Optional[List[int]] = None
    target_teams: Optional[List[int]] = None
    is_ab_test: bool = Field(False)
    variants: Optional[Dict[str, Any]] = None


class FeatureFlagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    enabled: Optional[bool] = None
    rollout_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    target_users: Optional[List[int]] = None
    target_teams: Optional[List[int]] = None
    is_ab_test: Optional[bool] = None
    variants: Optional[Dict[str, Any]] = None


class FeatureFlagResponse(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: float
    target_users: Optional[List[int]]
    target_teams: Optional[List[int]]
    is_ab_test: bool
    variants: Optional[Dict[str, Any]]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("/feature-flags", response_model=FeatureFlagResponse, status_code=status.HTTP_201_CREATED, tags=["feature-flags"])
async def create_feature_flag(
    flag_data: FeatureFlagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new feature flag for gradual rollout or A/B testing.
    
    Args:
        flag_data: Feature flag creation data (key, name, enabled, rollout_percentage, etc.)
        current_user: Authenticated user (will be set as creator)
        db: Database session
        
    Returns:
        FeatureFlagResponse: Created feature flag
        
    Raises:
        HTTPException: 400 if flag key already exists or validation fails
        HTTPException: 401 if user is not authenticated
    """
    try:
        service = FeatureFlagService(db)
        flag = await service.create_flag(
            key=flag_data.key,
            name=flag_data.name,
            description=flag_data.description,
            enabled=flag_data.enabled,
            rollout_percentage=flag_data.rollout_percentage,
            target_users=flag_data.target_users,
            target_teams=flag_data.target_teams,
            is_ab_test=flag_data.is_ab_test,
            variants=flag_data.variants,
            created_by_id=current_user.id
        )
        logger.info(
            f"Feature flag created: {flag.key} by user {current_user.id}",
            context={
                "flag_id": flag.id,
                "flag_key": flag.key,
                "user_id": current_user.id,
                "enabled": flag.enabled,
                "rollout_percentage": flag.rollout_percentage
            }
        )
        return FeatureFlagResponse.model_validate(flag)
    except ValueError as e:
        logger.warning(
            f"Failed to create feature flag: {e}",
            context={"flag_key": flag_data.key, "user_id": current_user.id}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Unexpected error creating feature flag: {e}",
            context={"flag_key": flag_data.key, "user_id": current_user.id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create feature flag"
        )


@router.get("/feature-flags", response_model=List[FeatureFlagResponse], tags=["feature-flags"])
async def get_feature_flags(
    enabled_only: bool = Query(False, description="Return only enabled flags"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all feature flags with optional filtering.
    
    Args:
        enabled_only: Return only enabled flags (default: False)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List[FeatureFlagResponse]: List of feature flags matching criteria
    """
    service = FeatureFlagService(db)
    flags = await service.get_all_flags(enabled_only=enabled_only)
    logger.debug(
        f"Feature flags retrieved by user {current_user.id}",
        context={"user_id": current_user.id, "enabled_only": enabled_only, "count": len(flags)}
    )
    return [FeatureFlagResponse.model_validate(f) for f in flags]


@router.get("/feature-flags/{key}", response_model=FeatureFlagResponse, tags=["feature-flags"])
async def get_feature_flag(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a feature flag by its unique key.
    
    Args:
        key: Feature flag key (unique identifier)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        FeatureFlagResponse: Feature flag data
        
    Raises:
        HTTPException: 404 if feature flag not found
    """
    service = FeatureFlagService(db)
    flag = await service.get_flag(key)
    if not flag:
        logger.debug(f"Feature flag not found: {key}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found"
        )
    logger.debug(f"Feature flag retrieved: {key} by user {current_user.id}")
    return FeatureFlagResponse.model_validate(flag)


@router.get("/feature-flags/{key}/check", tags=["feature-flags"])
async def check_feature_flag(
    key: str,
    team_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if a feature flag is enabled for the current user/team.
    
    Considers rollout percentage, target users/teams, and A/B test variants.
    
    Args:
        key: Feature flag key to check
        team_id: Optional team ID for team-based targeting
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Enabled status and variant (if A/B test)
        
    Raises:
        HTTPException: 404 if feature flag not found
    """
    service = FeatureFlagService(db)
    is_enabled = await service.is_enabled(key, user_id=current_user.id, team_id=team_id)
    variant = None
    if is_enabled:
        variant = await service.get_variant(key, user_id=current_user.id)
    
    logger.debug(
        f"Feature flag checked: {key} for user {current_user.id}",
        context={
            "flag_key": key,
            "user_id": current_user.id,
            "team_id": team_id,
            "enabled": is_enabled,
            "variant": variant
        }
    )
    
    return {
        "enabled": is_enabled,
        "variant": variant
    }


@router.put("/feature-flags/{flag_id}", response_model=FeatureFlagResponse, tags=["feature-flags"])
async def update_feature_flag(
    flag_id: int,
    flag_data: FeatureFlagUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing feature flag.
    
    Only provided fields will be updated (partial update).
    
    Args:
        flag_id: ID of the feature flag to update
        flag_data: Update data (only provided fields will be updated)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        FeatureFlagResponse: Updated feature flag
        
    Raises:
        HTTPException: 404 if feature flag not found
    """
    service = FeatureFlagService(db)
    updates = flag_data.model_dump(exclude_unset=True)
    try:
        flag = await service.update_flag(flag_id, updates)
        if not flag:
            logger.warning(f"Attempted to update non-existent feature flag: {flag_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feature flag not found"
            )
        logger.info(
            f"Feature flag updated: {flag.key} by user {current_user.id}",
            context={
                "flag_id": flag_id,
                "flag_key": flag.key,
                "user_id": current_user.id,
                "updated_fields": list(updates.keys())
            }
        )
        return FeatureFlagResponse.model_validate(flag)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to update feature flag: {e}",
            context={"flag_id": flag_id, "user_id": current_user.id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update feature flag"
        )


@router.delete("/feature-flags/{flag_id}", tags=["feature-flags"])
async def delete_feature_flag(
    flag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a feature flag.
    
    Args:
        flag_id: ID of the feature flag to delete
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if feature flag not found
    """
    service = FeatureFlagService(db)
    try:
        success = await service.delete_flag(flag_id)
        if success:
            logger.info(
                f"Feature flag deleted: {flag_id} by user {current_user.id}",
                context={"flag_id": flag_id, "user_id": current_user.id}
            )
            return {"success": True, "message": "Feature flag deleted successfully"}
        logger.warning(f"Attempted to delete non-existent feature flag: {flag_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to delete feature flag: {e}",
            context={"flag_id": flag_id, "user_id": current_user.id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete feature flag"
        )


@router.get("/feature-flags/{flag_id}/stats", tags=["feature-flags"])
async def get_feature_flag_stats(
    flag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get usage statistics for a feature flag.
    
    Returns metrics such as enabled count, variant distribution, etc.
    
    Args:
        flag_id: ID of the feature flag
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Statistics including enabled count, variant distribution, etc.
        
    Raises:
        HTTPException: 404 if feature flag not found
    """
    service = FeatureFlagService(db)
    stats = await service.get_flag_stats(flag_id)
    return stats



