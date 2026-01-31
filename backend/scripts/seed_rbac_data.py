#!/usr/bin/env python3
"""
Script to seed RBAC default data
Creates all default permissions and roles with their permissions
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.services.rbac_service import RBACService


async def seed_database():
    """Main seed function"""
    print("🌱 Seeding RBAC default data...")
    print(f"   Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            rbac_service = RBACService(db)
            
            print("📝 Creating permissions...")
            result = await rbac_service.seed_default_data()
            
            print(f"✅ Created/verified {len(result['permissions'])} permissions")
            print(f"✅ Created/verified {len(result['roles'])} roles")
            
            print()
            print("📋 Roles created:")
            for slug, role in result['roles'].items():
                perms = await rbac_service.get_role_permissions(role.id)
                print(f"   - {role.name} ({slug}): {len(perms)} permissions")
            
            print()
            print("✅ RBAC seeding completed!")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
