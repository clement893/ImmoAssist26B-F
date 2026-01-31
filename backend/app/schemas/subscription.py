"""
Subscription Schemas
Pydantic schemas for subscriptions and plans
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.plan import PlanInterval, PlanStatus
from app.models.subscription import SubscriptionStatus


# Plan Schemas
class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    amount: Decimal = Field(..., description="Price in cents")
    currency: str = Field(default="usd", max_length=3)
    interval: PlanInterval
    interval_count: int = Field(default=1)
    features: Optional[str] = None  # JSON string
    is_popular: bool = False


class PlanCreate(PlanBase):
    stripe_price_id: Optional[str] = None
    stripe_product_id: Optional[str] = None


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    status: Optional[PlanStatus] = None
    is_popular: Optional[bool] = None
    features: Optional[str] = None


class PlanResponse(PlanBase):
    id: int
    stripe_price_id: Optional[str] = None
    stripe_product_id: Optional[str] = None
    status: PlanStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlanListResponse(BaseModel):
    plans: List[PlanResponse]
    total: int


# Subscription Schemas
class SubscriptionBase(BaseModel):
    plan_id: int
    status: SubscriptionStatus = SubscriptionStatus.INCOMPLETE


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    plan_id: int
    plan: Optional[PlanResponse] = None
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    status: SubscriptionStatus
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    canceled_at: Optional[datetime] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm(cls, obj):
        """Create response from ORM object"""
        data = {
            "id": obj.id,
            "user_id": obj.user_id,
            "plan_id": obj.plan_id,
            "stripe_subscription_id": obj.stripe_subscription_id,
            "stripe_customer_id": obj.stripe_customer_id,
            "status": obj.status,
            "current_period_start": obj.current_period_start,
            "current_period_end": obj.current_period_end,
            "cancel_at_period_end": obj.cancel_at_period_end,
            "canceled_at": obj.canceled_at,
            "trial_start": obj.trial_start,
            "trial_end": obj.trial_end,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
        }
        if obj.plan:
            data["plan"] = PlanResponse.model_validate(obj.plan)
        return cls(**data)

    class Config:
        from_attributes = True


# Checkout Schemas
class CheckoutSessionCreate(BaseModel):
    plan_id: int
    success_url: str = Field(..., description="URL to redirect after successful payment")
    cancel_url: str = Field(..., description="URL to redirect after canceled payment")
    trial_days: Optional[int] = Field(None, ge=0, le=365, description="Trial period in days")


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class PortalSessionResponse(BaseModel):
    url: str


# Invoice Schemas
class InvoiceResponse(BaseModel):
    id: int
    user_id: int
    subscription_id: Optional[int] = None
    stripe_invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    amount_due: Decimal
    amount_paid: Decimal
    currency: str
    status: str
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    invoice_pdf_url: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

