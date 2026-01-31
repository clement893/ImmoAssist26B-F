"""
Seed Plans Script
Create default subscription plans
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.models.plan import Plan, PlanInterval, PlanStatus
from app.core.database import Base


async def seed_plans():
    """Seed default plans"""
    engine = create_async_engine(str(settings.DATABASE_URL))
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if plans already exist
        from sqlalchemy import select
        result = await session.execute(select(Plan))
        existing_plans = result.scalars().all()
        
        if existing_plans:
            print("Plans already exist. Skipping seed.")
            return

        # Create default plans
        plans = [
            Plan(
                name="Free",
                description="Perfect for getting started",
                amount=0,
                currency="usd",
                interval=PlanInterval.MONTH,
                interval_count=1,
                status=PlanStatus.ACTIVE,
                is_popular=False,
                features='{"max_users": 1, "max_projects": 3, "storage_gb": 1}',
            ),
            Plan(
                name="Pro",
                description="For growing teams",
                amount=29.00,
                currency="usd",
                interval=PlanInterval.MONTH,
                interval_count=1,
                status=PlanStatus.ACTIVE,
                is_popular=True,
                features='{"max_users": 10, "max_projects": 50, "storage_gb": 100, "priority_support": true}',
            ),
            Plan(
                name="Enterprise",
                description="For large organizations",
                amount=99.00,
                currency="usd",
                interval=PlanInterval.MONTH,
                interval_count=1,
                status=PlanStatus.ACTIVE,
                is_popular=False,
                features='{"max_users": -1, "max_projects": -1, "storage_gb": 1000, "priority_support": true, "custom_integrations": true}',
            ),
        ]

        for plan in plans:
            session.add(plan)

        await session.commit()
        print(f"✅ Created {len(plans)} default plans")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_plans())

