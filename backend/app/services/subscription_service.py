"""
Subscription Service
Service for managing subscriptions
"""

from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import Plan, Subscription, User
from app.models.plan import PlanStatus, PlanInterval
from app.models.subscription import SubscriptionStatus
from app.services.stripe_service import StripeService
from app.core.logging import logger


class SubscriptionService:
    """Service for managing subscriptions"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.stripe_service = StripeService(db)

    async def get_user_subscription(
        self, 
        user_id: int, 
        include_plan: bool = True
    ) -> Optional[Subscription]:
        """Get user's active subscription with optional plan eager loading"""
        query = (
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .where(Subscription.status.in_([
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
            ]))
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        
        if include_plan:
            query = query.options(selectinload(Subscription.plan))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_plans(
        self, 
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[Plan]:
        """Get all plans with pagination, optionally filtered by active status"""
        query = select(Plan)
        if active_only:
            query = query.where(Plan.status == PlanStatus.ACTIVE)
        query = query.order_by(Plan.amount.asc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_plan(self, plan_id: int) -> Optional[Plan]:
        """Get plan by ID"""
        result = await self.db.execute(
            select(Plan).where(Plan.id == plan_id)
        )
        return result.scalar_one_or_none()

    async def create_subscription(
        self,
        user_id: int,
        plan_id: int,
        stripe_subscription_id: str,
        stripe_customer_id: str,
        trial_end: Optional[datetime] = None,
        current_period_start: Optional[datetime] = None,
        current_period_end: Optional[datetime] = None
    ) -> Subscription:
        """Create subscription from Stripe"""
        # Check if user already has an active subscription
        existing = await self.get_user_subscription(user_id, include_plan=False)
        if existing:
            logger.warning(f"User {user_id} already has an active subscription {existing.id}")
            # Update existing instead of creating duplicate
            existing.stripe_subscription_id = stripe_subscription_id
            existing.stripe_customer_id = stripe_customer_id
            existing.plan_id = plan_id
            if trial_end:
                existing.trial_end = trial_end
                existing.status = SubscriptionStatus.TRIALING
            if current_period_start:
                existing.current_period_start = current_period_start
            if current_period_end:
                existing.current_period_end = current_period_end
            await self.db.commit()
            # Refresh non nécessaire, l'objet est déjà modifié en mémoire
            return existing

        plan = await self.get_plan(plan_id)
        if not plan:
            raise ValueError(f"Plan {plan_id} not found")

        now = datetime.now(timezone.utc)
        
        # Calculate period end based on plan interval if not provided
        if not current_period_end and not trial_end:
            if plan.interval == PlanInterval.MONTH:
                period_days = 30 * plan.interval_count
            elif plan.interval == PlanInterval.YEAR:
                period_days = 365 * plan.interval_count
            elif plan.interval == PlanInterval.WEEK:
                period_days = 7 * plan.interval_count
            else:  # DAY
                period_days = plan.interval_count
            current_period_end = now + timedelta(days=period_days)

        subscription = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
            status=SubscriptionStatus.TRIALING if trial_end else SubscriptionStatus.ACTIVE,
            trial_end=trial_end,
            current_period_start=current_period_start or now,
            current_period_end=current_period_end or trial_end,
        )

        self.db.add(subscription)
        await self.db.commit()
        # Refresh non nécessaire si pas besoin de relations lazy-loaded immédiatement

        return subscription

    async def update_subscription_status(
        self,
        stripe_subscription_id: str,
        status: SubscriptionStatus,
        current_period_start: Optional[datetime] = None,
        current_period_end: Optional[datetime] = None
    ) -> Optional[Subscription]:
        """Update subscription status from webhook"""
        if not stripe_subscription_id:
            logger.warning("update_subscription_status called with empty stripe_subscription_id")
            return None
        
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription_id
            )
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            logger.debug(f"Subscription with stripe_subscription_id {stripe_subscription_id} not found")
            return None

        subscription.status = status
        if current_period_start:
            subscription.current_period_start = current_period_start
        if current_period_end:
            subscription.current_period_end = current_period_end
        
        # Update canceled_at if status is CANCELED
        if status == SubscriptionStatus.CANCELED and not subscription.canceled_at:
            subscription.canceled_at = datetime.now(timezone.utc)

        await self.db.commit()
        # Refresh non nécessaire, l'objet est déjà modifié en mémoire

        return subscription

    async def cancel_subscription(self, subscription_id: int) -> bool:
        """Cancel subscription at period end"""
        subscription = await self._get_subscription_by_id(subscription_id)
        if not subscription:
            return False

        # Check if already canceled
        if subscription.cancel_at_period_end:
            logger.info(f"Subscription {subscription_id} already scheduled for cancellation")
            return True

        # Cancel in Stripe
        success = await self.stripe_service.cancel_subscription(subscription)
        if success:
            subscription.cancel_at_period_end = True
            subscription.canceled_at = datetime.now(timezone.utc)
            await self.db.commit()
            # Refresh non nécessaire, l'objet est déjà modifié en mémoire

        return success

    async def _get_subscription_by_id(self, subscription_id: int) -> Optional[Subscription]:
        """Helper to get subscription by ID"""
        result = await self.db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        return result.scalar_one_or_none()

    async def upgrade_plan(
        self,
        subscription_id: int,
        new_plan_id: int
    ) -> Optional[Subscription]:
        """Upgrade subscription to new plan with proration"""
        subscription = await self._get_subscription_by_id(subscription_id)
        if not subscription:
            return None

        # Check if already on this plan
        if subscription.plan_id == new_plan_id:
            logger.info(f"Subscription {subscription_id} already on plan {new_plan_id}")
            return subscription

        new_plan = await self.get_plan(new_plan_id)
        if not new_plan:
            raise ValueError(f"Plan {new_plan_id} not found")

        # Update in Stripe
        success = await self.stripe_service.update_subscription_plan(subscription, new_plan)
        if success:
            subscription.plan_id = new_plan_id
            await self.db.commit()
            # Refresh non nécessaire, l'objet est déjà modifié en mémoire
            return subscription

        return None

    async def check_subscription_expired(self, user_id: int) -> bool:
        """Check if user's subscription has expired"""
        subscription = await self.get_user_subscription(user_id)
        if not subscription:
            return True

        if subscription.current_period_end and subscription.current_period_end < datetime.now(timezone.utc):
            return True

        return False

