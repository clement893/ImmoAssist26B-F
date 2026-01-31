"""
Script to make a user a superadmin
Usage: python scripts/make_superadmin.py <email>
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.role import Role, UserRole


async def make_superadmin(email: str):
    """Make a user a superadmin by assigning them the superadmin role"""
    # Initialize database
    await init_db()
    
    async with AsyncSessionLocal() as db:
        try:
            # Find or create superadmin role
            result = await db.execute(select(Role).where(Role.slug == "superadmin"))
            superadmin_role = result.scalar_one_or_none()
            
            if not superadmin_role:
                # Create superadmin role if it doesn't exist
                superadmin_role = Role(
                    name="Super Admin",
                    slug="superadmin",
                    description="Super administrator with full system access",
                    is_system=True,
                    is_active=True
                )
                db.add(superadmin_role)
                await db.commit()
                await db.refresh(superadmin_role)
                print(f"✅ Created superadmin role (ID: {superadmin_role.id})")
            else:
                print(f"✅ Found existing superadmin role (ID: {superadmin_role.id})")
            
            # Find user by email
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if not user:
                print(f"❌ User with email '{email}' not found!")
                print("Please create the user first or check the email address.")
                return False
            
            print(f"✅ Found user: {user.email} (ID: {user.id})")
            
            # Check if user already has superadmin role
            result = await db.execute(
                select(UserRole).where(
                    UserRole.user_id == user.id,
                    UserRole.role_id == superadmin_role.id
                )
            )
            existing_user_role = result.scalar_one_or_none()
            
            if existing_user_role:
                print(f"✅ User '{email}' already has superadmin role!")
                return True
            
            # Assign superadmin role to user
            user_role = UserRole(
                user_id=user.id,
                role_id=superadmin_role.id
            )
            db.add(user_role)
            await db.commit()
            
            print(f"✅ Successfully assigned superadmin role to '{email}'!")
            return True
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False


async def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python scripts/make_superadmin.py <email>")
        print("Example: python scripts/make_superadmin.py clement@nukleo.com")
        sys.exit(1)
    
    email = sys.argv[1].strip().lower()
    print(f"Making '{email}' a superadmin...")
    print("-" * 50)
    
    success = await make_superadmin(email)
    
    if success:
        print("-" * 50)
        print("✅ Done!")
        sys.exit(0)
    else:
        print("-" * 50)
        print("❌ Failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())


