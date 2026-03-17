"""
Tests for SubscriptionService
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.subscription_service import SubscriptionService
from app.models import Plan, Subscription, User
from app.models.plan import PlanStatus, PlanInterval
from app.models.subscription import SubscriptionStatus


@pytest.fixture
async def mock_db():
    """Mock database session"""
    db = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


@pytest.fixture
def subscription_service(mock_db):
    """Create SubscriptionService instance"""
    return SubscriptionService(mock_db)


@pytest.fixture
def sample_plan():
    """Sample plan for testing"""
    plan = MagicMock(spec=Plan)
    plan.id = 1
    plan.name = "Pro"
    plan.amount = 29.00
    plan.status = PlanStatus.ACTIVE
    return plan


@pytest.fixture
def sample_subscription():
    """Sample subscription for testing"""
    subscription = MagicMock(spec=Subscription)
    subscription.id = 1
    subscription.user_id = 1
    subscription.plan_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.current_period_start = datetime.now(timezone.utc)
    subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
    subscription.plan = MagicMock()
    subscription.plan.id = 1
    subscription.plan.name = "Pro"
    return subscription


class TestGetUserSubscription:
    """Tests for get_user_subscription method"""

    @pytest.mark.asyncio
    async def test_get_user_subscription_with_plan(self, subscription_service, mock_db, sample_subscription):
        """Test getting user subscription with plan eager loading"""
        from sqlalchemy.orm import Result
        
        # Mock result
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_subscription
        mock_db.execute.return_value = mock_result
        
        subscription = await subscription_service.get_user_subscription(1, include_plan=True)
        
        assert subscription == sample_subscription
        assert subscription.plan is not None
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_subscription_without_plan(self, subscription_service, mock_db, sample_subscription):
        """Test getting user subscription without plan"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_subscription
        mock_db.execute.return_value = mock_result
        
        subscription = await subscription_service.get_user_subscription(1, include_plan=False)
        
        assert subscription == sample_subscription
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_subscription_not_found(self, subscription_service, mock_db):
        """Test getting user subscription when not found"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        subscription = await subscription_service.get_user_subscription(999)
        
        assert subscription is None


class TestGetAllPlans:
    """Tests for get_all_plans method"""

    @pytest.mark.asyncio
    async def test_get_all_plans_active_only(self, subscription_service, mock_db, sample_plan):
        """Test getting all active plans"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_plan]
        mock_db.execute.return_value = mock_result
        
        plans = await subscription_service.get_all_plans(active_only=True)
        
        assert len(plans) == 1
        assert plans[0] == sample_plan

    @pytest.mark.asyncio
    async def test_get_all_plans_including_inactive(self, subscription_service, mock_db):
        """Test getting all plans including inactive"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        
        plans = await subscription_service.get_all_plans(active_only=False)
        
        assert isinstance(plans, list)


class TestGetPlan:
    """Tests for get_plan method"""

    @pytest.mark.asyncio
    async def test_get_plan_found(self, subscription_service, mock_db, sample_plan):
        """Test getting plan by ID when found"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_plan
        mock_db.execute.return_value = mock_result
        
        plan = await subscription_service.get_plan(1)
        
        assert plan == sample_plan
        assert plan.id == 1

    @pytest.mark.asyncio
    async def test_get_plan_not_found(self, subscription_service, mock_db):
        """Test getting plan by ID when not found"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        plan = await subscription_service.get_plan(999)
        
        assert plan is None


class TestCreateSubscription:
    """Tests for create_subscription method"""

    @pytest.mark.asyncio
    async def test_create_subscription_success(self, subscription_service, mock_db, sample_plan):
        """Test creating subscription successfully"""
        # Mock get_plan
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_plan
        mock_db.execute.return_value = mock_result
        
        # Mock new subscription
        new_subscription = MagicMock(spec=Subscription)
        new_subscription.id = 1
        
        with patch('app.services.subscription_service.Subscription', return_value=new_subscription):
            subscription = await subscription_service.create_subscription(
                user_id=1,
                plan_id=1,
                stripe_subscription_id="sub_test",
                stripe_customer_id="cus_test",
            )
            
            assert subscription is not None
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_subscription_plan_not_found(self, subscription_service, mock_db):
        """Test creating subscription when plan not found"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        with pytest.raises(ValueError, match="Plan.*not found"):
            await subscription_service.create_subscription(
                user_id=1,
                plan_id=999,
                stripe_subscription_id="sub_test",
                stripe_customer_id="cus_test",
            )


class TestCancelSubscription:
    """Tests for cancel_subscription method"""

    @pytest.mark.asyncio
    async def test_cancel_subscription_success(self, subscription_service, mock_db, sample_subscription):
        """Test canceling subscription successfully"""
        # Mock get_subscription_by_id
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_subscription
        mock_db.execute.return_value = mock_result
        
        # Mock stripe service
        with patch.object(subscription_service.stripe_service, 'cancel_subscription', return_value=True):
            success = await subscription_service.cancel_subscription(1)
            
            assert success is True
            assert sample_subscription.cancel_at_period_end is True
            assert sample_subscription.canceled_at is not None
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_subscription_not_found(self, subscription_service, mock_db):
        """Test canceling subscription when not found"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        success = await subscription_service.cancel_subscription(999)
        
        assert success is False


class TestCheckSubscriptionExpired:
    """Tests for check_subscription_expired method"""

    @pytest.mark.asyncio
    async def test_subscription_not_expired(self, subscription_service, mock_db, sample_subscription):
        """Test checking non-expired subscription"""
        sample_subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=10)
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_subscription
        mock_db.execute.return_value = mock_result
        
        expired = await subscription_service.check_subscription_expired(1)
        
        assert expired is False

    @pytest.mark.asyncio
    async def test_subscription_expired(self, subscription_service, mock_db, sample_subscription):
        """Test checking expired subscription"""
        sample_subscription.current_period_end = datetime.now(timezone.utc) - timedelta(days=1)
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_subscription
        mock_db.execute.return_value = mock_result
        
        expired = await subscription_service.check_subscription_expired(1)
        
        assert expired is True

    @pytest.mark.asyncio
    async def test_no_subscription(self, subscription_service, mock_db):
        """Test checking when user has no subscription"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        expired = await subscription_service.check_subscription_expired(999)
        
        assert expired is True

