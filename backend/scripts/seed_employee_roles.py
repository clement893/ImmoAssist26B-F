#!/usr/bin/env python3
"""
Script to seed Employee roles for ERP portals
Creates employee roles with appropriate permissions for different departments
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


async def seed_employee_roles(db: AsyncSession):
    """Create employee roles if they don't exist"""
    print("📝 Creating employee roles...")
    
    rbac_service = RBACService(db)
    
    # Define employee roles
    employee_roles = [
        {
            "name": "Employee",
            "slug": "employee",
            "description": "General employee with basic ERP access",
            "is_system": True,
        },
        {
            "name": "Sales",
            "slug": "sales",
            "description": "Sales department employee with order management access",
            "is_system": True,
        },
        {
            "name": "Accounting",
            "slug": "accounting",
            "description": "Accounting department employee with invoice and financial access",
            "is_system": True,
        },
        {
            "name": "Inventory",
            "slug": "inventory",
            "description": "Inventory department employee with stock management access",
            "is_system": True,
        },
    ]
    
    created_roles = []
    
    for role_data in employee_roles:
        # Check if role exists
        result = await db.execute(select(Role).where(Role.slug == role_data["slug"]))
        existing_role = result.scalar_one_or_none()
        
        if existing_role:
            print(f"✅ {role_data['name']} role already exists")
            created_roles.append(existing_role)
        else:
            # Create role
            role = await rbac_service.create_role(
                name=role_data["name"],
                slug=role_data["slug"],
                description=role_data["description"],
                is_system=role_data["is_system"],
            )
            print(f"✅ {role_data['name']} role created (ID: {role.id})")
            created_roles.append(role)
    
    return created_roles


async def seed_database():
    """Main seed function"""
    print("🌱 Seeding employee roles...")
    print(f"   Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            roles = await seed_employee_roles(db)
            print()
            print(f"✅ {len(roles)} employee role(s) seeded successfully!")
            print()
            print("📋 Roles created:")
            for role in roles:
                print(f"   - {role.name} ({role.slug})")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            await db.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())

