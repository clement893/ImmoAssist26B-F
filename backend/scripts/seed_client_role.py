#!/usr/bin/env python3
"""
Script to seed Client role for ERP portals
Creates the client role with appropriate permissions
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.models.role import Role
from app.services.rbac_service import RBACService


async def seed_client_role(db: AsyncSession):
    """Create client role if it doesn't exist"""
    print("📝 Creating client role...")
    
    rbac_service = RBACService(db)
    
    # Check if client role exists
    result = await db.execute(select(Role).where(Role.slug == "client"))
    existing_role = result.scalar_one_or_none()
    
    if existing_role:
        print("✅ Client role already exists")
        return existing_role
    
    # Create client role
    client_role = await rbac_service.create_role(
        name="Client",
        slug="client",
        description="Client portal user with access to own orders, invoices, and projects",
        is_system=True,
    )
    
    print(f"✅ Client role created: {client_role.name} (ID: {client_role.id})")
    return client_role


async def seed_database():
    """Main seed function"""
    print("🌱 Seeding client role...")
    print(f"   Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            await seed_client_role(db)
            print()
            print("✅ Client role seeding completed!")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            await db.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())

