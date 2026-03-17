#!/usr/bin/env python3
"""
RBAC Diagnostic Script
Diagnoses and fixes RBAC permission issues
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, func

from app.core.config import settings
from app.models import User, Role, Permission, UserRole, RolePermission
from app.services.rbac_service import RBACService


async def diagnose_rbac(db: AsyncSession, user_email: str = None):
    """Diagnose RBAC issues"""
    print("🔍 RBAC Diagnostic Report")
    print("=" * 60)
    print()
    
    rbac_service = RBACService(db)
    
    # Check roles
    roles_result = await db.execute(select(Role))
    roles = roles_result.scalars().all()
    print(f"📋 Roles in database: {len(roles)}")
    for role in roles:
        perms_result = await db.execute(
            select(func.count(RolePermission.permission_id))
            .where(RolePermission.role_id == role.id)
        )
        perm_count = perms_result.scalar() or 0
        print(f"   - {role.name} ({role.slug}): {perm_count} permissions, active={role.is_active}, system={role.is_system}")
    print()
    
    # Check permissions
    perms_result = await db.execute(select(Permission))
    permissions = perms_result.scalars().all()
    print(f"🔐 Permissions in database: {len(permissions)}")
    if len(permissions) < 10:
        print("   ⚠️  WARNING: Very few permissions found. RBAC data may not be seeded.")
        print("   First 10 permissions:")
        for perm in permissions[:10]:
            print(f"      - {perm.name} ({perm.resource}:{perm.action})")
    print()
    
    # Check users
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()
    print(f"👥 Users in database: {len(users)}")
    
    # Check specific user if provided
    if user_email:
        user_result = await db.execute(select(User).where(User.email == user_email))
        user = user_result.scalar_one_or_none()
        if user:
            print(f"\n👤 User: {user.email} (ID: {user.id})")
            print(f"   is_admin: {user.is_admin}")
            print(f"   is_superadmin: {getattr(user, 'is_superadmin', 'N/A')}")
            
            # Get user roles
            user_roles = await rbac_service.get_user_roles(user.id)
            print(f"   Roles assigned: {len(user_roles)}")
            for ur in user_roles:
                print(f"      - {ur.name} ({ur.slug})")
            
            # Get user permissions
            user_perms = await rbac_service.get_user_permissions(user.id)
            print(f"   Permissions: {len(user_perms)}")
            if user_perms:
                print(f"      Permissions: {', '.join(sorted(list(user_perms))[:10])}")
                if len(user_perms) > 10:
                    print(f"      ... and {len(user_perms) - 10} more")
            
            # Check specific permissions needed for RBAC endpoints
            required_perms = ["roles:read", "permissions:read", "users:read"]
            print(f"\n   🔒 Permission checks:")
            for perm in required_perms:
                has_perm = await rbac_service.has_permission(user.id, perm)
                status = "✅" if has_perm else "❌"
                print(f"      {status} {perm}: {has_perm}")
            
            # Check superadmin role
            has_superadmin = await rbac_service.has_role(user.id, "superadmin")
            print(f"\n   👑 Superadmin role: {'✅ YES' if has_superadmin else '❌ NO'}")
            
            if not has_superadmin:
                print(f"\n   ⚠️  ISSUE: User does not have 'superadmin' role!")
                print(f"   This is why RBAC endpoints return 403 Forbidden.")
        else:
            print(f"\n   ❌ User '{user_email}' not found in database")
    else:
        print("\n   ℹ️  No user email provided. Use --user-email to check specific user.")
        print("   First 5 users:")
        for user in users[:5]:
            user_roles = await rbac_service.get_user_roles(user.id)
            has_superadmin = await rbac_service.has_role(user.id, "superadmin")
            print(f"      - {user.email} (ID: {user.id}): {len(user_roles)} roles, superadmin={'✅' if has_superadmin else '❌'}")
    
    print()
    print("=" * 60)
    
    # Recommendations
    print("\n💡 Recommendations:")
    if len(roles) == 0:
        print("   1. Run seed script to create default roles and permissions")
    if len(permissions) < 20:
        print("   2. Run seed script to create default permissions")
    if user_email and user:
        has_superadmin = await rbac_service.has_role(user.id, "superadmin")
        if not has_superadmin:
            print("   3. Assign 'superadmin' role to this user")
            print("      Run: python scripts/fix_rbac_user.py --user-email <email> --assign-superadmin")
    print()


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Diagnose RBAC issues")
    parser.add_argument("--user-email", help="Email of user to diagnose")
    args = parser.parse_args()
    
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        try:
            await diagnose_rbac(db, args.user_email)
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
