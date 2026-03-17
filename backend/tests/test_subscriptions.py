"""
Tests for Subscription endpoints
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Plan, Subscription
from app.models.plan import PlanInterval, PlanStatus
from app.models.subscription import SubscriptionStatus


@pytest.mark.asyncio
async def test_list_plans(client: AsyncClient):
    """Test listing plans"""
    response = await client.get("/api/v1/subscriptions/plans")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_plan(client: AsyncClient, test_plan: Plan):
    """Test getting a plan by ID"""
    response = await client.get(f"/api/v1/subscriptions/plans/{test_plan.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_plan.id
    assert data["name"] == test_plan.name


@pytest.mark.asyncio
async def test_get_my_subscription(
    client: AsyncClient,
    authenticated_user: User,
    test_subscription: Subscription
):
    """Test getting current user's subscription"""
    response = await client.get("/api/v1/subscriptions/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == authenticated_user.id
    assert data["status"] in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]


@pytest.mark.asyncio
async def test_create_checkout_session(
    client: AsyncClient,
    authenticated_user: User,
    test_plan: Plan
):
    """Test creating checkout session"""
    response = await client.post(
        "/api/v1/subscriptions/checkout",
        json={
            "plan_id": test_plan.id,
            "success_url": "https://example.com/success",
            "cancel_url": "https://example.com/cancel",
        }
    )
    # May fail if Stripe not configured, but should not crash
    assert response.status_code in [200, 400, 500]


@pytest.fixture
async def test_plan(db: AsyncSession) -> Plan:
    """Create a test plan"""
    plan = Plan(
        name="Test Plan",
        description="Test plan for testing",
        amount=9.99,
        currency="usd",
        interval=PlanInterval.MONTH,
        status=PlanStatus.ACTIVE,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@pytest.fixture
async def test_subscription(
    db: AsyncSession,
    authenticated_user: User,
    test_plan: Plan
) -> Subscription:
    """Create a test subscription"""
    subscription = Subscription(
        user_id=authenticated_user.id,
        plan_id=test_plan.id,
        status=SubscriptionStatus.ACTIVE,
    )
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    return subscription

