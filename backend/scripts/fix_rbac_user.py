#!/usr/bin/env python3
"""
RBAC User Fix Script
Assigns superadmin role to a user and seeds RBAC data if needed
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.models import User, Role
from app.services.rbac_service import RBACService
from app.core.permissions import Permission


async def seed_default_permissions(rbac_service: RBACService, db: AsyncSession):
    """Seed default permissions"""
    print("📝 Seeding default permissions...")
    
    # Define all default permissions
    default_permissions = [
        # User permissions
        ("users", "read", "Read user information"),
        ("users", "create", "Create new users"),
        ("users", "update", "Update user information"),
        ("users", "delete", "Delete users"),
        ("users", "list", "List all users"),
        
        # Role permissions
        ("roles", "read", "Read role information"),
        ("roles", "create", "Create new roles"),
        ("roles", "update", "Update role information"),
        ("roles", "delete", "Delete roles"),
        ("roles", "list", "List all roles"),
        
        # Permission permissions
        ("permissions", "read", "Read permission information"),
        ("permissions", "create", "Create new permissions"),
        ("permissions", "update", "Update permission information"),
        ("permissions", "delete", "Delete permissions"),
        ("permissions", "list", "List all permissions"),
        
        # Admin sections permissions
        ("admin", "users", "Access admin users section"),
        ("admin", "invitations", "Access admin invitations section"),
        ("admin", "organizations", "Access admin organizations section"),
        ("admin", "themes", "Access admin themes section"),
        ("admin", "settings", "Access admin settings section"),
        ("admin", "logs", "Access admin logs section"),
        ("admin", "statistics", "Access admin statistics section"),
        ("admin", "rbac", "Access admin RBAC section"),
        ("admin", "teams", "Access admin teams section"),
        ("admin", "tenancy", "Access admin tenancy section"),
        
        # Admin wildcard (grants all admin permissions)
        ("admin", "*", "All admin permissions"),
    ]
    
    created_count = 0
    for resource, action, description in default_permissions:
        name = f"{resource}:{action}"
        # Check if permission exists
        from app.models import Permission as PermModel
        result = await db.execute(select(PermModel).where(PermModel.name == name))
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
    
    # Define default roles with their default permissions
    default_roles = [
        {
            "name": "Super Admin",
            "slug": "superadmin",
            "description": "Super administrator with all permissions",
            "is_system": True,
            "permissions": ["admin:*"],  # Superadmin gets admin:* (all permissions)
        },
        {
            "name": "Admin",
            "slug": "admin",
            "description": "Administrator with most permissions",
            "is_system": True,
            "permissions": [
                "admin:*",  # Admin gets all admin permissions
                "users:read", "users:create", "users:update", "users:list",
                "roles:read", "roles:list",
                "permissions:read", "permissions:list",
            ],
        },
        {
            "name": "Manager",
            "slug": "manager",
            "description": "Manager with team management permissions",
            "is_system": True,
            "permissions": [
                "admin:users", "admin:teams", "admin:statistics",
                "users:read", "users:list",
                "teams:read", "teams:create", "teams:update", "teams:list",
            ],
        },
        {
            "name": "User",
            "slug": "user",
            "description": "Standard user",
            "is_system": True,
            "permissions": [],  # Standard users have no admin permissions
        },
    ]
    
    created_count = 0
    for role_data in default_roles:
        # Check if role exists
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
                # Find permission
                from app.models import Permission as PermModel
                perm_result = await db.execute(select(PermModel).where(PermModel.name == perm_name))
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
                from app.models import Permission as PermModel
                perm_result = await db.execute(select(PermModel).where(PermModel.name == perm_name))
                perm = perm_result.scalar_one_or_none()
                
                if perm:
                    # Check if already assigned
                    from app.models import RolePermission
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
    
    # Find user
    result = await db.execute(select(User).where(User.email == user_email))
    user = result.scalar_one_or_none()
    
    if not user:
        print(f"❌ User '{user_email}' not found!")
        return False
    
    # Find superadmin role
    result = await db.execute(select(Role).where(Role.slug == "superadmin"))
    superadmin_role = result.scalar_one_or_none()
    
    if not superadmin_role:
        print("❌ Superadmin role not found! Please seed roles first.")
        return False
    
    # Check if already assigned
    rbac_service = RBACService(db)
    has_role = await rbac_service.has_role(user.id, "superadmin")
    
    if has_role:
        print(f"✅ User already has superadmin role")
        return True
    
    # Assign role
    try:
        await rbac_service.assign_role(user.id, superadmin_role.id)
        print(f"✅ Successfully assigned superadmin role to {user_email}")
        return True
    except ValueError as e:
        print(f"⚠️  {e}")
        return False


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fix RBAC user permissions")
    parser.add_argument("--user-email", required=True, help="Email of user to fix")
    parser.add_argument("--assign-superadmin", action="store_true", help="Assign superadmin role")
    parser.add_argument("--seed-data", action="store_true", help="Seed default RBAC data")
    args = parser.parse_args()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            rbac_service = RBACService(db)
            
            if args.seed_data:
                await seed_default_permissions(rbac_service, db)
                await seed_default_roles(rbac_service, db)
                print("\n✅ RBAC data seeding completed!")
            
            if args.assign_superadmin:
                success = await assign_superadmin_role(db, args.user_email)
                if success:
                    print("\n✅ User permissions fixed!")
                else:
                    print("\n❌ Failed to fix user permissions")
                    sys.exit(1)
            
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
