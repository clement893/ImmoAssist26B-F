#!/usr/bin/env python3
"""
Fix migration 036 issue in production database.

This script fixes the issue where migration 036 failed because the revision
ID was too long (36 characters > 32 character limit).

Steps:
1. Check current database state
2. Remove any bad alembic_version entry if it exists
3. Ensure columns exist (they might have been added before the migration failed)
4. Mark migration as complete if columns already exist
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import text
from app.core.database import async_session_maker, engine


async def check_columns_exist():
    """Check if the required columns exist"""
    async with async_session_maker() as session:
        result = await session.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'real_estate_transactions' 
            AND column_name IN ('current_action_code', 'last_action_at', 'action_count')
        """))
        columns = {row[0] for row in result.fetchall()}
        return columns


async def check_table_exists(table_name: str):
    """Check if a table exists"""
    async with async_session_maker() as session:
        result = await session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = :table_name
            )
        """), {"table_name": table_name})
        return result.scalar()


async def check_alembic_version():
    """Check current alembic version"""
    async with async_session_maker() as session:
        result = await session.execute(text("SELECT version_num FROM alembic_version"))
        row = result.fetchone()
        return row[0] if row else None


async def fix_migration():
    """Fix the migration issue"""
    async with async_session_maker() as session:
        try:
            # Check current state
            print("Checking database state...")
            current_version = await check_alembic_version()
            print(f"Current alembic version: {current_version}")
            
            # Check if user_availabilities table exists (migration 035)
            user_availabilities_exists = await check_table_exists('user_availabilities')
            print(f"Table user_availabilities exists: {user_availabilities_exists}")
            
            columns = await check_columns_exist()
            print(f"Existing columns: {columns}")
            
            # If user_availabilities exists but version is before 035, update version
            if user_availabilities_exists and current_version not in ['035_create_user_availabilities', '036_fix_txn_actions']:
                print("\n⚠ Warning: user_availabilities table exists but version is not 035 or 036")
                print("This suggests migration 035 was partially applied")
                # Don't auto-fix this, let migrations handle it
            
            # Check if we need to add missing columns
            missing_columns = {'current_action_code', 'last_action_at', 'action_count'} - columns
            
            if missing_columns:
                print(f"\nAdding missing columns: {missing_columns}")
                
                if 'current_action_code' in missing_columns:
                    await session.execute(text("""
                        ALTER TABLE real_estate_transactions 
                        ADD COLUMN IF NOT EXISTS current_action_code VARCHAR(50)
                    """))
                
                if 'last_action_at' in missing_columns:
                    await session.execute(text("""
                        ALTER TABLE real_estate_transactions 
                        ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP WITH TIME ZONE
                    """))
                
                if 'action_count' in missing_columns:
                    await session.execute(text("""
                        ALTER TABLE real_estate_transactions 
                        ADD COLUMN IF NOT EXISTS action_count INTEGER DEFAULT 0
                    """))
                
                await session.commit()
                print("✓ Columns added successfully")
            else:
                print("✓ All required columns already exist")
            
            # Check if there's a bad version entry (the old long revision ID)
            result = await session.execute(text("""
                SELECT version_num FROM alembic_version 
                WHERE version_num LIKE '036_fix_transaction%'
            """))
            bad_entry = result.fetchone()
            
            if bad_entry:
                print(f"\nFound bad version entry: {bad_entry[0]}")
                print("Removing bad entry...")
                await session.execute(text("""
                    DELETE FROM alembic_version 
                    WHERE version_num LIKE '036_fix_transaction%'
                """))
                await session.commit()
                print("✓ Bad entry removed")
            
            # Update to correct version if needed
            current_version = await check_alembic_version()
            if current_version != '036_fix_txn_actions':
                if current_version == '035_create_user_availabilities':
                    print("\nUpdating alembic_version to 036_fix_txn_actions...")
                    await session.execute(text("""
                        UPDATE alembic_version 
                        SET version_num = '036_fix_txn_actions'
                        WHERE version_num = '035_create_user_availabilities'
                    """))
                    await session.commit()
                    print("✓ Version updated")
                else:
                    print(f"\nCurrent version is {current_version}, not updating")
            
            # Verify final state
            final_version = await check_alembic_version()
            final_columns = await check_columns_exist()
            
            print("\n" + "="*50)
            print("Final state:")
            print(f"  Alembic version: {final_version}")
            print(f"  Columns: {final_columns}")
            
            if final_columns == {'current_action_code', 'last_action_at', 'action_count'}:
                print("\n✓ Database is in correct state!")
                return 0
            else:
                print("\n⚠ Warning: Some columns are still missing")
                return 1
                
        except Exception as e:
            await session.rollback()
            print(f"\n✗ Error: {e}")
            import traceback
            traceback.print_exc()
            return 1


async def main():
    """Main entry point"""
    print("="*50)
    print("Migration 036 Fix Script")
    print("="*50)
    print()
    
    exit_code = await fix_migration()
    
    print("\n" + "="*50)
    if exit_code == 0:
        print("✓ Fix completed successfully")
    else:
        print("✗ Fix completed with warnings/errors")
    
    return exit_code


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
