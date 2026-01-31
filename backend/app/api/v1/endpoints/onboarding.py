"""
Onboarding API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.services.onboarding_service import OnboardingService
from app.models.user import User
from app.models.onboarding import OnboardingStep
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class OnboardingStepResponse(BaseModel):
    id: int
    key: str
    title: str
    description: Optional[str]
    order: int
    step_type: str
    step_data: Optional[dict]
    required: bool

    class Config:
        from_attributes = True


class OnboardingProgressResponse(BaseModel):
    is_completed: bool
    current_step: Optional[str]
    completed_count: int
    total_count: int
    progress_percentage: float


@router.get("/onboarding/steps", response_model=List[OnboardingStepResponse], tags=["onboarding"])
async def get_onboarding_steps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get active onboarding steps for the current user"""
    from app.services.rbac_service import RBACService
    
    service = OnboardingService(db)
    rbac_service = RBACService(db)
    user_roles = await rbac_service.get_user_roles(current_user.id)
    # Convert roles to list of role slugs for the service
    user_role_slugs = [role.slug for role in user_roles] if user_roles else None
    steps = await service.get_active_steps(user_roles=user_role_slugs)
    return [OnboardingStepResponse.model_validate(s) for s in steps]


@router.get("/onboarding/progress", response_model=OnboardingProgressResponse, tags=["onboarding"])
async def get_onboarding_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get onboarding progress for the current user"""
    service = OnboardingService(db)
    progress = await service.get_progress(current_user.id)
    return OnboardingProgressResponse(**progress)


@router.get("/onboarding/next-step", response_model=Optional[OnboardingStepResponse], tags=["onboarding"])
async def get_next_step(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the next onboarding step for the current user"""
    service = OnboardingService(db)
    # Initialize if needed
    await service.initialize_onboarding(current_user.id)
    step = await service.get_next_step(current_user.id)
    if step:
        return OnboardingStepResponse.model_validate(step)
    return None


@router.post("/onboarding/initialize", tags=["onboarding"])
async def initialize_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize onboarding for the current user"""
    from app.services.rbac_service import RBACService
    
    service = OnboardingService(db)
    rbac_service = RBACService(db)
    user_roles = await rbac_service.get_user_roles(current_user.id)
    # Convert roles to list of role slugs for the service
    user_role_slugs = [role.slug for role in user_roles] if user_roles else None
    onboarding = await service.initialize_onboarding(current_user.id, user_roles=user_role_slugs)
    return {"success": True, "message": "Onboarding initialized"}


@router.post("/onboarding/steps/{step_key}/complete", tags=["onboarding"])
async def complete_step(
    step_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an onboarding step as completed"""
    service = OnboardingService(db)
    onboarding = await service.complete_step(current_user.id, step_key)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not initialized"
        )
    return {"success": True, "message": "Step completed"}


@router.post("/onboarding/steps/{step_key}/skip", tags=["onboarding"])
async def skip_step(
    step_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Skip an onboarding step"""
    service = OnboardingService(db)
    onboarding = await service.skip_step(current_user.id, step_key)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not initialized"
        )
    return {"success": True, "message": "Step skipped"}




