"""
Plan Model
SQLAlchemy model for subscription plans
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Numeric, Text, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PlanInterval(str, enum.Enum):
    """Plan billing interval"""
    MONTH = "month"
    YEAR = "year"
    WEEK = "week"
    DAY = "day"


class PlanStatus(str, enum.Enum):
    """Plan status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class Plan(Base):
    """Subscription plan model"""
    __tablename__ = "plans"
    __table_args__ = (
        Index("idx_plans_stripe_id", "stripe_price_id"),
        Index("idx_plans_status", "status"),
        Index("idx_plans_interval", "interval"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Pricing
    amount = Column(Numeric(10, 2), nullable=False)  # Price in cents
    currency = Column(String(3), default="usd", nullable=False)
    interval = Column(SQLEnum(PlanInterval), nullable=False, default=PlanInterval.MONTH)
    interval_count = Column(Integer, default=1, nullable=False)  # e.g., 3 for quarterly
    
    # Stripe integration
    stripe_price_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_product_id = Column(String(255), nullable=True)
    
    # Plan features (stored as JSON)
    features = Column(Text, nullable=True)  # JSON string of features/limits
    
    # Status
    status = Column(SQLEnum(PlanStatus), default=PlanStatus.ACTIVE, nullable=False, index=True)
    is_popular = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

    def __repr__(self) -> str:
        return f"<Plan(id={self.id}, name={self.name}, amount={self.amount})>"

