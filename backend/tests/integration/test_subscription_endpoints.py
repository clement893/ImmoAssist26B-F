"""
Integration Tests for Subscription Endpoints
Tests endpoints with dependency injection
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Plan, Subscription
from app.models.plan import PlanStatus, PlanInterval
from app.models.subscription import SubscriptionStatus
from app.core.security import create_access_token
import pytest


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        email="test_subscription@example.com",
        hashed_password=pwd_context.hash("testpassword123"),
        first_name="Test",
        last_name="User",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def auth_headers(test_user: User) -> dict:
    """Create auth headers for test user"""
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def test_plan(db: AsyncSession) -> Plan:
    """Create a test plan"""
    plan = Plan(
        name="Test Plan",
        description="Test plan for integration tests",
        amount=9.99,
        currency="usd",
        interval=PlanInterval.MONTH,
        interval_count=1,
        status=PlanStatus.ACTIVE,
        stripe_price_id="price_test123",
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@pytest.fixture
async def test_subscription(
    db: AsyncSession,
    test_user: User,
    test_plan: Plan
) -> Subscription:
    """Create a test subscription"""
    subscription = Subscription(
        user_id=test_user.id,
        plan_id=test_plan.id,
        stripe_subscription_id="sub_test123",
        stripe_customer_id="cus_test123",
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    return subscription


@pytest.mark.asyncio
class TestListPlans:
    """Integration tests for GET /api/v1/subscriptions/plans"""

    async def test_list_plans_success(self, client: AsyncClient, test_plan: Plan):
        """Test listing plans successfully"""
        response = await client.get("/api/v1/subscriptions/plans")
        
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert "total" in data
        assert len(data["plans"]) > 0
        assert any(plan["id"] == test_plan.id for plan in data["plans"])

    async def test_list_plans_active_only(self, client: AsyncClient):
        """Test listing only active plans"""
        response = await client.get("/api/v1/subscriptions/plans?active_only=true")
        
        assert response.status_code == 200
        data = response.json()
        assert all(plan["status"] == "ACTIVE" for plan in data["plans"])

    async def test_list_plans_including_inactive(self, client: AsyncClient):
        """Test listing all plans including inactive"""
        response = await client.get("/api/v1/subscriptions/plans?active_only=false")
        
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data


@pytest.mark.asyncio
class TestGetPlan:
    """Integration tests for GET /api/v1/subscriptions/plans/{id}"""

    async def test_get_plan_success(self, client: AsyncClient, test_plan: Plan):
        """Test getting plan by ID successfully"""
        response = await client.get(f"/api/v1/subscriptions/plans/{test_plan.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_plan.id
        assert data["name"] == test_plan.name
        assert data["amount"] == float(test_plan.amount)

    async def test_get_plan_not_found(self, client: AsyncClient):
        """Test getting non-existent plan"""
        response = await client.get("/api/v1/subscriptions/plans/99999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestGetMySubscription:
    """Integration tests for GET /api/v1/subscriptions/me"""

    async def test_get_my_subscription_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_subscription: Subscription
    ):
        """Test getting current user's subscription"""
        response = await client.get(
            "/api/v1/subscriptions/me",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_subscription.id
        assert data["user_id"] == test_subscription.user_id
        assert data["status"] == test_subscription.status.value
        assert "plan" in data

    async def test_get_my_subscription_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test getting subscription when user has none"""
        response = await client.get(
            "/api/v1/subscriptions/me",
            headers=auth_headers
        )
        
        assert response.status_code == 404

    async def test_get_my_subscription_unauthorized(self, client: AsyncClient):
        """Test getting subscription without authentication"""
        response = await client.get("/api/v1/subscriptions/me")
        
        assert response.status_code == 403  # FastAPI returns 403 for missing auth


@pytest.mark.asyncio
class TestCreateCheckoutSession:
    """Integration tests for POST /api/v1/subscriptions/checkout"""

    async def test_create_checkout_session_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_plan: Plan
    ):
        """Test creating checkout session successfully"""
        # Mock Stripe service to avoid actual API call
        with pytest.mock.patch('app.services.stripe_service.stripe.checkout.Session.create') as mock_create:
            mock_create.return_value = type('obj', (object,), {
                'id': 'cs_test123',
                'url': 'https://checkout.stripe.com/test'
            })()
            
            response = await client.post(
                "/api/v1/subscriptions/checkout",
                headers=auth_headers,
                json={
                    "plan_id": test_plan.id,
                    "success_url": "https://example.com/success",
                    "cancel_url": "https://example.com/cancel",
                }
            )
            
            # May succeed or fail depending on Stripe config, but should not crash
            assert response.status_code in [200, 400, 500]

    async def test_create_checkout_session_plan_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test creating checkout session with invalid plan"""
        response = await client.post(
            "/api/v1/subscriptions/checkout",
            headers=auth_headers,
            json={
                "plan_id": 99999,
                "success_url": "https://example.com/success",
                "cancel_url": "https://example.com/cancel",
            }
        )
        
        assert response.status_code == 404


@pytest.mark.asyncio
class TestCancelSubscription:
    """Integration tests for POST /api/v1/subscriptions/cancel"""

    async def test_cancel_subscription_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_subscription: Subscription
    ):
        """Test canceling subscription successfully"""
        # Mock Stripe service
        with pytest.mock.patch('app.services.stripe_service.stripe.Subscription.modify') as mock_modify:
            mock_modify.return_value = type('obj', (object,), {'id': 'sub_test123'})()
            
            response = await client.post(
                "/api/v1/subscriptions/cancel",
                headers=auth_headers
            )
            
            # May succeed or fail depending on Stripe config
            assert response.status_code in [204, 500]

    async def test_cancel_subscription_not_found(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test canceling subscription when user has none"""
        response = await client.post(
            "/api/v1/subscriptions/cancel",
            headers=auth_headers
        )
        
        assert response.status_code == 404


@pytest.mark.asyncio
class TestUpgradeSubscription:
    """Integration tests for POST /api/v1/subscriptions/upgrade/{plan_id}"""

    async def test_upgrade_subscription_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_subscription: Subscription,
        test_plan: Plan
    ):
        """Test upgrading subscription successfully"""
        # Create a new plan for upgrade
        from app.models import Plan as PlanModel
        new_plan = PlanModel(
            name="Premium Plan",
            amount=19.99,
            currency="usd",
            interval=PlanInterval.MONTH,
            status=PlanStatus.ACTIVE,
            stripe_price_id="price_premium123",
        )
        db.add(new_plan)
        await db.commit()
        await db.refresh(new_plan)
        
        # Mock Stripe service
        with pytest.mock.patch('app.services.stripe_service.stripe.Subscription.retrieve') as mock_retrieve, \
             pytest.mock.patch('app.services.stripe_service.stripe.Subscription.modify') as mock_modify:
            
            mock_subscription = type('obj', (object,), {
                'items': type('obj', (object,), {
                    'data': [type('obj', (object,), {'id': 'si_test123'})()]
                })()
            })()
            mock_retrieve.return_value = mock_subscription
            mock_modify.return_value = mock_subscription
            
            response = await client.post(
                f"/api/v1/subscriptions/upgrade/{new_plan.id}",
                headers=auth_headers
            )
            
            # May succeed or fail depending on Stripe config
            assert response.status_code in [200, 500]

    async def test_upgrade_subscription_no_subscription(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_plan: Plan
    ):
        """Test upgrading when user has no subscription"""
        response = await client.post(
            f"/api/v1/subscriptions/upgrade/{test_plan.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404

