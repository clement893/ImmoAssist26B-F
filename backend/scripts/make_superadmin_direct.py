#!/usr/bin/env python3
"""
Script to make a user superadmin directly in the database using asyncpg
Usage: python scripts/make_superadmin_direct.py
"""

import asyncio
import asyncpg
import sys


async def make_superadmin():
    """Make a user superadmin"""
    import os
    import sys
    
    # Get database URL from environment variable or command line argument
    database_url = os.getenv('DATABASE_URL')
    if not database_url and len(sys.argv) >= 2:
        database_url = sys.argv[1]
    if not database_url:
        print("❌ DATABASE_URL not set. Please set it as environment variable or pass as argument:")
        print("   export DATABASE_URL='postgresql://user:password@host:port/database'")
        print("   OR")
        print("   python make_superadmin_direct.py postgresql://user:password@host:port/database email@example.com")
        sys.exit(1)
    
    # Get email from environment variable or command line argument
    email = os.getenv('SUPERADMIN_EMAIL')
    if not email and len(sys.argv) >= 3:
        email = sys.argv[2]
    if not email:
        email = "clement@nukleo.com"  # Default email - change as needed
        print(f"⚠️  Using default email: {email}")
        print("   Set SUPERADMIN_EMAIL environment variable or pass as second argument to use different email")
    
    try:
        # Parse connection string
        # asyncpg uses postgresql:// format directly
        conn = await asyncpg.connect(database_url)
        
        print(f"✅ Connected to database")
        print(f"🔧 Making '{email}' superadmin...\n")
        
        # Step 1: Ensure superadmin role exists
        await conn.execute("""
            INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
            VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING
        """)
        print("✅ Superadmin role ensured")
        
        # Step 2: Add superadmin role to user
        result = await conn.execute("""
            INSERT INTO user_roles (user_id, role_id, created_at)
            SELECT u.id, r.id, NOW()
            FROM users u
            CROSS JOIN roles r
            WHERE u.email = $1
              AND r.slug = 'superadmin'
            ON CONFLICT (user_id, role_id) DO NOTHING
        """, email)
        
        if "INSERT 0 0" in result:
            print(f"⚠️  User '{email}' already has superadmin role")
        else:
            print(f"✅ Added superadmin role to '{email}'")
        
        # Step 3: Verify
        row = await conn.fetchrow("""
            SELECT 
                u.email,
                u.id as user_id,
                r.name as role_name,
                r.slug as role_slug,
                ur.created_at as role_assigned_at
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.email = $1 AND r.slug = 'superadmin'
        """, email)
        
        if row:
            print(f"\n✅ Verification successful:")
            print(f"   Email: {row['email']}")
            print(f"   User ID: {row['user_id']}")
            print(f"   Role: {row['role_name']} ({row['role_slug']})")
            print(f"   Assigned at: {row['role_assigned_at']}")
        else:
            print(f"\n⚠️  Warning: Could not verify superadmin role for '{email}'")
        
        await conn.close()
        print("\n✅ Done! User is now a superadmin.")
        return True
        
    except asyncpg.exceptions.InvalidPasswordError:
        print("❌ Error: Invalid database password")
        return False
    except asyncpg.exceptions.InvalidCatalogNameError:
        print("❌ Error: Database 'railway' not found")
        return False
    except asyncpg.exceptions.PostgresError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(make_superadmin())
    sys.exit(0 if success else 1)


