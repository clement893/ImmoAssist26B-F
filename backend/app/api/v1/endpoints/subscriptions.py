"""
Subscription Endpoints
API endpoints for subscription management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.cache import cached
from app.dependencies import (
    get_current_user,
    get_subscription_service,
    get_stripe_service,
)
from app.models import User
from app.services.subscription_service import SubscriptionService
from app.services.stripe_service import StripeService
from app.schemas.subscription import (
    PlanResponse,
    PlanListResponse,
    SubscriptionResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    PortalSessionResponse,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=PlanListResponse)
@cached(expire=3600, key_prefix="plans")  # Cache 1h car plans changent rarement
async def list_plans(
    active_only: bool = Query(True, description="Only return active plans"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """List all available subscription plans with pagination"""
    plans = await subscription_service.get_all_plans(
        active_only=active_only,
        skip=skip,
        limit=limit
    )
    
    return PlanListResponse(
        plans=[PlanResponse.model_validate(plan) for plan in plans],
        total=len(plans)
    )


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: int,
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """Get plan by ID"""
    plan = await subscription_service.get_plan(plan_id)
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    return PlanResponse.model_validate(plan)


@router.get("/me", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """Get current user's subscription"""
    subscription = await subscription_service.get_user_subscription(
        current_user.id, 
        include_plan=True
    )
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    return SubscriptionResponse.model_validate(subscription)


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    stripe_service: StripeService = Depends(get_stripe_service),
):
    """Create Stripe checkout session"""
    plan = await subscription_service.get_plan(checkout_data.plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    if not plan.stripe_price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan is not configured for Stripe"
        )
    
    session = await stripe_service.create_checkout_session(
        user=current_user,
        plan=plan,
        success_url=checkout_data.success_url,
        cancel_url=checkout_data.cancel_url,
        trial_days=checkout_data.trial_days,
    )
    
    return CheckoutSessionResponse(**session)


@router.post("/portal", response_model=PortalSessionResponse)
async def create_portal_session(
    return_url: str = Query(..., description="URL to return to after portal"),
    current_user: User = Depends(get_current_user),
    stripe_service: StripeService = Depends(get_stripe_service),
):
    """Create Stripe customer portal session"""
    session = await stripe_service.create_portal_session(
        user=current_user,
        return_url=return_url,
    )
    
    return PortalSessionResponse(**session)


@router.post("/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """Cancel current user's subscription"""
    subscription = await subscription_service.get_user_subscription(current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    success = await subscription_service.cancel_subscription(subscription.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )
    
    return None


@router.post("/upgrade/{plan_id}", response_model=SubscriptionResponse)
async def upgrade_subscription(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """Upgrade subscription to new plan"""
    subscription = await subscription_service.get_user_subscription(current_user.id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Check if trying to upgrade to same plan
    if subscription.plan_id == plan_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already subscribed to this plan"
        )
    
    # Verify plan exists
    plan = await subscription_service.get_plan(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    updated_subscription = await subscription_service.upgrade_plan(
        subscription.id,
        plan_id
    )
    
    if not updated_subscription:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upgrade subscription"
        )
    
    # Reload with plan relationship
    updated_subscription = await subscription_service.get_user_subscription(
        current_user.id,
        include_plan=True
    )
    
    return SubscriptionResponse.model_validate(updated_subscription)

