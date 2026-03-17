"""
Advanced Billing Service

Provides advanced billing features:
- Prorated billing calculations
- Plan upgrades/downgrades
- Subscription pauses/resumes
- Usage-based billing
- Billing period adjustments

@example
```python
from app.services.billing_advanced import BillingAdvancedService

billing_service = BillingAdvancedService()

# Upgrade plan with prorated billing
result = await billing_service.upgrade_plan(
    subscription_id=subscription.id,
    new_plan_id="pro",
    prorate=True
)

# Pause subscription
await billing_service.pause_subscription(subscription_id)
```
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import Subscription
from app.core.logging import logger


class BillingAdvancedService:
    """Advanced billing service with prorated billing and plan changes"""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize advanced billing service.
        
        @param db - Database session
        """
        self.db = db
    
    async def calculate_prorated_amount(
        self,
        current_plan_price: Decimal,
        new_plan_price: Decimal,
        days_remaining: int,
        total_days_in_period: int
    ) -> Decimal:
        """
        Calculate prorated amount for plan change.
        
        @param current_plan_price - Current plan monthly price
        @param new_plan_price - New plan monthly price
        @param days_remaining - Days remaining in current billing period
        @param total_days_in_period - Total days in billing period
        @returns Prorated amount to charge/credit
        
        @example
        ```python
        prorated = await billing_service.calculate_prorated_amount(
            current_plan_price=Decimal("29.00"),
            new_plan_price=Decimal("49.00"),
            days_remaining=15,
            total_days_in_period=30
        )
        # Returns: 10.00 (difference prorated for remaining days)
        ```
        """
        if days_remaining <= 0 or total_days_in_period <= 0:
            return Decimal("0.00")
        
        # Calculate daily rates
        current_daily_rate = current_plan_price / Decimal(str(total_days_in_period))
        new_daily_rate = new_plan_price / Decimal(str(total_days_in_period))
        
        # Calculate difference for remaining days
        daily_difference = new_daily_rate - current_daily_rate
        prorated_amount = daily_difference * Decimal(str(days_remaining))
        
        return prorated_amount.quantize(Decimal("0.01"))
    
    async def upgrade_plan(
        self,
        subscription: Subscription,
        new_plan_id: str,
        prorate: bool = True,
        effective_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Upgrade subscription plan with optional prorated billing.
        
        @param subscription - Current subscription
        @param new_plan_id - New plan identifier
        @param prorate - Whether to prorate the billing
        @param effective_date - When the upgrade should take effect (default: now)
        @returns Upgrade result dictionary
        
        @example
        ```python
        result = await billing_service.upgrade_plan(
            subscription=subscription,
            new_plan_id="pro",
            prorate=True
        )
        ```
        """
        effective_date = effective_date or datetime.utcnow()
        
        # Get plan prices (from your plan configuration)
        current_plan_price = self._get_plan_price(subscription.plan)
        new_plan_price = self._get_plan_price(new_plan_id)
        
        # Calculate prorated amount if needed
        prorated_amount = Decimal("0.00")
        if prorate:
            days_remaining = (subscription.current_period_end - effective_date).days
            total_days = (subscription.current_period_end - subscription.current_period_start).days
            
            prorated_amount = await self.calculate_prorated_amount(
                current_plan_price=current_plan_price,
                new_plan_price=new_plan_price,
                days_remaining=days_remaining,
                total_days_in_period=total_days
            )
        
        # Update subscription
        subscription.plan = new_plan_id
        
        # If prorated amount is positive, charge immediately
        if prorated_amount > 0:
            # Create immediate invoice for prorated amount
            # (implementation depends on your invoice system)
            logger.info(f"Charging prorated amount: {prorated_amount} for upgrade")
        
        await self.db.commit()
        
        return {
            "success": True,
            "new_plan": new_plan_id,
            "prorated_amount": float(prorated_amount),
            "effective_date": effective_date.isoformat(),
        }
    
    async def downgrade_plan(
        self,
        subscription: Subscription,
        new_plan_id: str,
        prorate: bool = True,
        effective_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Downgrade subscription plan with optional prorated credit.
        
        @param subscription - Current subscription
        @param new_plan_id - New plan identifier
        @param prorate - Whether to prorate the credit
        @param effective_date - When the downgrade should take effect
        @returns Downgrade result dictionary
        """
        effective_date = effective_date or datetime.utcnow()
        
        # Get plan prices
        current_plan_price = self._get_plan_price(subscription.plan)
        new_plan_price = self._get_plan_price(new_plan_id)
        
        # Calculate prorated credit if needed
        prorated_credit = Decimal("0.00")
        if prorate:
            days_remaining = (subscription.current_period_end - effective_date).days
            total_days = (subscription.current_period_end - subscription.current_period_start).days
            
            prorated_credit = await self.calculate_prorated_amount(
                current_plan_price=current_plan_price,
                new_plan_price=new_plan_price,
                days_remaining=days_remaining,
                total_days_in_period=total_days
            )
            # Credit is negative (we're refunding)
            prorated_credit = -prorated_credit
        
        # Update subscription
        subscription.plan = new_plan_id
        
        # If prorated credit is positive, credit the account
        if prorated_credit > 0:
            logger.info(f"Crediting prorated amount: {prorated_credit} for downgrade")
        
        await self.db.commit()
        
        return {
            "success": True,
            "new_plan": new_plan_id,
            "prorated_credit": float(prorated_credit),
            "effective_date": effective_date.isoformat(),
        }
    
    async def pause_subscription(
        self,
        subscription: Subscription,
        resume_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Pause subscription (freeze billing but keep access until period end).
        
        @param subscription - Subscription to pause
        @param resume_date - When to automatically resume (optional)
        @returns Pause result dictionary
        """
        subscription.status = "paused"
        subscription.paused_at = datetime.utcnow()
        subscription.resume_date = resume_date
        
        await self.db.commit()
        
        logger.info(f"Subscription {subscription.id} paused")
        
        return {
            "success": True,
            "status": "paused",
            "paused_at": subscription.paused_at.isoformat(),
            "resume_date": resume_date.isoformat() if resume_date else None,
        }
    
    async def resume_subscription(
        self,
        subscription: Subscription
    ) -> Dict[str, Any]:
        """
        Resume paused subscription.
        
        @param subscription - Subscription to resume
        @returns Resume result dictionary
        """
        subscription.status = "active"
        subscription.resumed_at = datetime.utcnow()
        subscription.paused_at = None
        subscription.resume_date = None
        
        await self.db.commit()
        
        logger.info(f"Subscription {subscription.id} resumed")
        
        return {
            "success": True,
            "status": "active",
            "resumed_at": subscription.resumed_at.isoformat(),
        }
    
    async def adjust_billing_period(
        self,
        subscription: Subscription,
        new_period_start: datetime,
        new_period_end: datetime
    ) -> Dict[str, Any]:
        """
        Adjust billing period dates (for manual adjustments).
        
        @param subscription - Subscription to adjust
        @param new_period_start - New period start date
        @param new_period_end - New period end date
        @returns Adjustment result dictionary
        """
        old_period_start = subscription.current_period_start
        old_period_end = subscription.current_period_end
        
        subscription.current_period_start = new_period_start
        subscription.current_period_end = new_period_end
        
        await self.db.commit()
        
        logger.info(
            f"Adjusted billing period for subscription {subscription.id}: "
            f"{old_period_start} - {old_period_end} -> {new_period_start} - {new_period_end}"
        )
        
        return {
            "success": True,
            "old_period": {
                "start": old_period_start.isoformat(),
                "end": old_period_end.isoformat(),
            },
            "new_period": {
                "start": new_period_start.isoformat(),
                "end": new_period_end.isoformat(),
            },
        }
    
    def _get_plan_price(self, plan_id: str) -> Decimal:
        """
        Get plan price from configuration.
        
        @param plan_id - Plan identifier
        @returns Plan monthly price
        """
        # This should come from your plan configuration
        plan_prices = {
            "free": Decimal("0.00"),
            "starter": Decimal("9.00"),
            "pro": Decimal("29.00"),
            "enterprise": Decimal("99.00"),
        }
        
        return plan_prices.get(plan_id.lower(), Decimal("0.00"))

