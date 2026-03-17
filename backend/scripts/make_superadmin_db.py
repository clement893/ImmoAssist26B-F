#!/usr/bin/env python3
"""
Script to make a user superadmin directly in the database
Usage: python scripts/make_superadmin_db.py <email> <database_url>
"""

import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Add parent directory to path for imports
sys.path.insert(0, '.')

from app.models.user import User
from app.models.role import Role, UserRole


async def make_superadmin(email: str, database_url: str):
    """Make a user superadmin by adding them to the superadmin role"""
    
    # Convert postgresql:// to postgresql+asyncpg:// for async
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    
    # Create async engine
    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Find user by email
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            
            if not user:
                print(f"❌ User with email '{email}' not found in database")
                return False
            
            print(f"✅ Found user: {user.email} (ID: {user.id})")
            
            # Find or create superadmin role
            result = await session.execute(select(Role).where(Role.slug == "superadmin"))
            role = result.scalar_one_or_none()
            
            if not role:
                # Create superadmin role if it doesn't exist
                role = Role(
                    name="Super Admin",
                    slug="superadmin",
                    description="Super administrator with full system access",
                    is_system=True,
                    is_active=True
                )
                session.add(role)
                await session.flush()  # Flush to get the role ID
                print(f"✅ Created superadmin role (ID: {role.id})")
            else:
                print(f"✅ Found superadmin role (ID: {role.id})")
            
            # Check if user already has superadmin role
            result = await session.execute(
                select(UserRole).where(
                    UserRole.user_id == user.id,
                    UserRole.role_id == role.id
                )
            )
            existing_user_role = result.scalar_one_or_none()
            
            if existing_user_role:
                print(f"⚠️  User '{email}' already has superadmin role")
                return True
            
            # Create user role association
            user_role = UserRole(
                user_id=user.id,
                role_id=role.id
            )
            session.add(user_role)
            await session.commit()
            
            print(f"✅ Successfully added superadmin role to user '{email}'")
            return True
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/make_superadmin_db.py <email> [database_url]")
        print("\nExample:")
        print("  python scripts/make_superadmin_db.py clement@nukleo.com")
        print("  python scripts/make_superadmin_db.py clement@nukleo.com postgresql://user:pass@host:port/db")
        sys.exit(1)
    
    email = sys.argv[1]
    
    if len(sys.argv) >= 3:
        database_url = sys.argv[2]
    else:
        # Try to get from environment variable
        import os
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not set. Please set it as environment variable or pass as argument:")
            print("   export DATABASE_URL='postgresql://user:password@host:port/database'")
            print("   OR")
            print("   python make_superadmin_db.py email@example.com postgresql://user:password@host:port/database")
            sys.exit(1)
    
    print(f"🔧 Making user '{email}' superadmin...")
    print(f"📊 Database: {database_url.split('@')[1] if '@' in database_url else 'local'}\n")
    
    success = asyncio.run(make_superadmin(email, database_url))
    
    if success:
        print("\n✅ Done! User is now a superadmin.")
        sys.exit(0)
    else:
        print("\n❌ Failed to make user superadmin.")
        sys.exit(1)


