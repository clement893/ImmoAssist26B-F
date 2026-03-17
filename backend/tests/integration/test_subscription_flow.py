"""
Integration tests for subscription management flow
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.plan import Plan, PlanInterval


@pytest.mark.integration
@pytest.mark.asyncio
class TestSubscriptionFlow:
    """Integration tests for subscription management"""
    
    async def test_create_subscription_flow(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test creating a subscription"""
        # Create a plan
        plan = Plan(
            name="Pro Plan",
            description="Professional plan",
            price=29.99,
            interval=PlanInterval.MONTHLY,
            features=["feature1", "feature2"],
            is_active=True,
        )
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
        
        # Create subscription
        subscription = Subscription(
            user_id=test_user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        
        assert subscription.id is not None
        assert subscription.user_id == test_user.id
        assert subscription.status == SubscriptionStatus.ACTIVE
    
    async def test_subscription_cancellation_flow(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test canceling a subscription"""
        # Create plan and subscription
        plan = Plan(
            name="Test Plan",
            price=19.99,
            interval=PlanInterval.MONTHLY,
            is_active=True,
        )
        db.add(plan)
        await db.commit()
        
        subscription = Subscription(
            user_id=test_user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        
        # Cancel subscription
        subscription.status = SubscriptionStatus.CANCELED
        subscription.canceled_at = datetime.utcnow()
        await db.commit()
        await db.refresh(subscription)
        
        assert subscription.status == SubscriptionStatus.CANCELED
        assert subscription.canceled_at is not None
    
    async def test_subscription_renewal_flow(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test subscription renewal"""
        # Create plan and subscription
        plan = Plan(
            name="Renewal Plan",
            price=29.99,
            interval=PlanInterval.MONTHLY,
            is_active=True,
        )
        db.add(plan)
        await db.commit()
        
        old_end = datetime.utcnow() + timedelta(days=5)
        subscription = Subscription(
            user_id=test_user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=datetime.utcnow() - timedelta(days=25),
            current_period_end=old_end,
        )
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)
        
        # Renew subscription
        subscription.current_period_start = old_end
        subscription.current_period_end = old_end + timedelta(days=30)
        await db.commit()
        await db.refresh(subscription)
        
        assert subscription.current_period_end > old_end

