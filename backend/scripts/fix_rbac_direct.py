#!/usr/bin/env python3
"""
RBAC Direct Fix Script
Connects directly to Railway database and fixes RBAC issues
"""

import asyncio
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.models import User, Role, Permission, UserRole, RolePermission
from app.services.rbac_service import RBACService


async def seed_default_permissions(rbac_service: RBACService, db: AsyncSession):
    """Seed default permissions"""
    print("📝 Seeding default permissions...")
    
    default_permissions = [
        ("users", "read", "Read user information"),
        ("users", "create", "Create new users"),
        ("users", "update", "Update user information"),
        ("users", "delete", "Delete users"),
        ("users", "list", "List all users"),
        ("roles", "read", "Read role information"),
        ("roles", "create", "Create new roles"),
        ("roles", "update", "Update role information"),
        ("roles", "delete", "Delete roles"),
        ("roles", "list", "List all roles"),
        ("permissions", "read", "Read permission information"),
        ("permissions", "create", "Create new permissions"),
        ("permissions", "update", "Update permission information"),
        ("permissions", "delete", "Delete permissions"),
        ("permissions", "list", "List all permissions"),
        ("admin", "*", "All admin permissions"),
    ]
    
    created_count = 0
    for resource, action, description in default_permissions:
        name = f"{resource}:{action}"
        result = await db.execute(select(Permission).where(Permission.name == name))
        existing = result.scalar_one_or_none()
        
        if not existing:
            await rbac_service.create_permission(resource, action, description)
            created_count += 1
            print(f"   ✅ Created: {name}")
    
    print(f"✅ Created {created_count} new permissions")
    return created_count


async def seed_default_roles(rbac_service: RBACService, db: AsyncSession):
    """Seed default roles"""
    print("📝 Seeding default roles...")
    
    default_roles = [
        {
            "name": "Super Admin",
            "slug": "superadmin",
            "description": "Super administrator with all permissions",
            "is_system": True,
            "permissions": ["admin:*"],
        },
        {
            "name": "Admin",
            "slug": "admin",
            "description": "Administrator with most permissions",
            "is_system": True,
            "permissions": ["admin:*", "users:read", "users:update", "users:list"],
        },
    ]
    
    created_count = 0
    for role_data in default_roles:
        result = await db.execute(select(Role).where(Role.slug == role_data["slug"]))
        existing_role = result.scalar_one_or_none()
        
        if not existing_role:
            role = await rbac_service.create_role(
                name=role_data["name"],
                slug=role_data["slug"],
                description=role_data["description"],
                is_system=role_data["is_system"],
            )
            created_count += 1
            print(f"   ✅ Created role: {role.name} ({role.slug})")
            
            # Assign permissions to role
            for perm_name in role_data["permissions"]:
                perm_result = await db.execute(select(Permission).where(Permission.name == perm_name))
                perm = perm_result.scalar_one_or_none()
                
                if perm:
                    try:
                        await rbac_service.assign_permission_to_role(role.id, perm.id)
                        print(f"      ✅ Assigned permission: {perm_name}")
                    except ValueError:
                        pass  # Already assigned
        else:
            # Role exists, ensure permissions are assigned
            for perm_name in role_data["permissions"]:
                perm_result = await db.execute(select(Permission).where(Permission.name == perm_name))
                perm = perm_result.scalar_one_or_none()
                
                if perm:
                    rp_result = await db.execute(
                        select(RolePermission)
                        .where(RolePermission.role_id == existing_role.id)
                        .where(RolePermission.permission_id == perm.id)
                    )
                    if not rp_result.scalar_one_or_none():
                        try:
                            await rbac_service.assign_permission_to_role(existing_role.id, perm.id)
                            print(f"      ✅ Assigned permission {perm_name} to existing role {existing_role.name}")
                        except ValueError:
                            pass
    
    print(f"✅ Created {created_count} new roles")
    return created_count


async def assign_superadmin_role(db: AsyncSession, user_email: str):
    """Assign superadmin role to a user"""
    print(f"👤 Assigning superadmin role to user: {user_email}")
    
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    
    if not user:
        print(f"❌ User '{user_email}' not found!")
        return False
    
    result = await db.execute(select(Role).where(Role.slug == "superadmin"))
    superadmin_role = result.scalar_one_or_none()
    
    if not superadmin_role:
        print("❌ Superadmin role not found! Please seed roles first.")
        return False
    
    rbac_service = RBACService(db)
    has_role = await rbac_service.has_role(user.id, "superadmin")
    
    if has_role:
        print(f"✅ User already has superadmin role")
        return True
    
    try:
        await rbac_service.assign_role(user.id, superadmin_role.id)
        print(f"✅ Successfully assigned superadmin role to {user_email}")
        return True
    except ValueError as e:
        print(f"⚠️  {e}")
        return False


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fix RBAC issues directly")
    parser.add_argument("--user-email", required=True, help="Email of user to fix")
    parser.add_argument("--seed-data", action="store_true", help="Seed default RBAC data")
    parser.add_argument("--assign-superadmin", action="store_true", help="Assign superadmin role")
    args = parser.parse_args()
    
    print("🔧 RBAC Direct Fix Script")
    print("=" * 60)
    print(f"Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    print()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            rbac_service = RBACService(db)
            
            if args.seed_data:
                await seed_default_permissions(rbac_service, db)
                await seed_default_roles(rbac_service, db)
                print()
            
            if args.assign_superadmin:
                success = await assign_superadmin_role(db, args.user_email)
                if not success:
                    print("\n❌ Failed to assign superadmin role")
                    sys.exit(1)
            
            print()
            print("=" * 60)
            print("✅ RBAC fix completed successfully!")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
            sys.exit(1)
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
