"""Database seed script."""

import asyncio
import sys

from app.database import AsyncSessionLocal, init_db
from app.models import User
from app.core.security import hash_password


async def seed_database():
    """Seed database with sample data."""
    # Initialize database
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if users already exist
        from sqlalchemy import select
        result = await session.execute(select(User))
        existing_users = result.scalars().all()

        if existing_users:
            print("Database already seeded. Skipping...")
            return

        # Create sample users
        sample_users = [
            User(
                email="admin@example.com",
                name="Admin User",
                password_hash=hash_password("admin123"),
                is_active=True,
                is_verified=True,
            ),
            User(
                email="user@example.com",
                name="Test User",
                password_hash=hash_password("user123"),
                is_active=True,
                is_verified=False,
            ),
        ]

        for user in sample_users:
            session.add(user)

        await session.commit()
        print(f"✓ Seeded {len(sample_users)} users")


if __name__ == "__main__":
    asyncio.run(seed_database())
