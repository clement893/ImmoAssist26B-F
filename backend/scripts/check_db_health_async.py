"""
Database Health Check Script (Async)
Uses the app's database connection setup
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.core.config import settings

EXPECTED_TABLES = {
    'users': ['id', 'email', 'hashed_password', 'is_active', 'created_at', 'updated_at'],
    'roles': ['id', 'name', 'slug', 'is_active'],
    'permissions': ['id', 'resource', 'action', 'name'],
    'role_permissions': ['id', 'role_id', 'permission_id'],
    'user_roles': ['id', 'user_id', 'role_id'],
    'teams': ['id', 'name', 'slug', 'owner_id', 'is_active'],
    'team_members': ['id', 'team_id', 'user_id', 'role_id'],
    'invitations': ['id', 'email', 'token', 'status', 'expires_at'],
    'plans': ['id', 'name', 'amount', 'interval', 'status'],
    'subscriptions': ['id', 'user_id', 'plan_id', 'status'],
    'invoices': ['id', 'user_id', 'amount_due', 'status'],
    'projects': ['id', 'user_id', 'name', 'status'],
    'themes': ['id', 'name', 'is_active', 'config'],
    'files': ['id', 'user_id', 'filename', 'file_path'],
    'api_keys': ['id', 'user_id', 'key_hash', 'is_active'],
    'webhook_events': ['id', 'event_type', 'stripe_event_id']
}

async def check_tables_exist(session):
    """Check if all expected tables exist"""
    result = await session.execute(text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """))
    existing_tables = {row[0] for row in result}
    expected = set(EXPECTED_TABLES.keys())
    
    missing = expected - existing_tables
    extra = existing_tables - expected
    
    return list(missing), list(extra), existing_tables

async def check_table_columns(session, table_name):
    """Check table columns"""
    result = await session.execute(text("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = :table_name
        ORDER BY ordinal_position;
    """), {"table_name": table_name})
    
    return {row[0]: {'type': row[1], 'nullable': row[2] == 'YES'} for row in result}

async def check_data_integrity(session):
    """Check for data integrity issues"""
    issues = []
    
    # Check for duplicate emails
    result = await session.execute(text("""
        SELECT email, COUNT(*) as count
        FROM users
        GROUP BY email
        HAVING COUNT(*) > 1;
    """))
    duplicates = result.fetchall()
    if duplicates:
        issues.append(f"❌ Duplicate emails found: {len(duplicates)}")
    
    # Check for orphaned subscriptions
    result = await session.execute(text("""
        SELECT COUNT(*) FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE u.id IS NULL;
    """))
    orphaned = result.scalar()
    if orphaned > 0:
        issues.append(f"❌ Orphaned subscriptions: {orphaned}")
    
    # Check for orphaned team members
    result = await session.execute(text("""
        SELECT COUNT(*) FROM team_members tm
        LEFT JOIN teams t ON tm.team_id = t.id
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE t.id IS NULL OR u.id IS NULL;
    """))
    orphaned = result.scalar()
    if orphaned > 0:
        issues.append(f"❌ Orphaned team members: {orphaned}")
    
    # Check for multiple active themes
    result = await session.execute(text("""
        SELECT COUNT(*) FROM themes WHERE is_active = true;
    """))
    active_themes = result.scalar()
    if active_themes > 1:
        issues.append(f"⚠️  Multiple active themes: {active_themes} (should be 1)")
    
    return issues

async def get_table_stats(session):
    """Get statistics for each table"""
    stats = {}
    for table in sorted(EXPECTED_TABLES.keys()):
        try:
            result = await session.execute(text(f"SELECT COUNT(*) FROM {table};"))
            count = result.scalar()
            stats[table] = count
        except Exception as e:
            stats[table] = f"Error: {str(e)[:50]}"
    return stats

async def main():
    """Main health check function"""
    print("=" * 80)
    print("DATABASE HEALTH CHECK")
    print("=" * 80)
    print(f"\nDatabase URL: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}\n")
    
    async with AsyncSessionLocal() as session:
        # 1. Check tables exist
        print("=" * 80)
        print("TABLE EXISTENCE CHECK")
        print("=" * 80)
        
        missing, extra, existing = await check_tables_exist(session)
        
        if not missing:
            print(f"\n✅ All {len(EXPECTED_TABLES)} expected tables exist")
        else:
            print(f"\n❌ Missing tables ({len(missing)}):")
            for table in missing:
                print(f"   - {table}")
        
        if extra:
            print(f"\nℹ️  Extra tables ({len(extra)}):")
            for table in extra[:10]:  # Show first 10
                print(f"   - {table}")
            if len(extra) > 10:
                print(f"   ... and {len(extra) - 10} more")
        
        # 2. Check table structures
        print("\n" + "=" * 80)
        print("TABLE STRUCTURE CHECK")
        print("=" * 80)
        
        structure_issues = []
        for table_name in sorted(EXPECTED_TABLES.keys()):
            if table_name in existing:
                try:
                    columns = await check_table_columns(session, table_name)
                    expected_cols = set(EXPECTED_TABLES[table_name])
                    actual_cols = set(columns.keys())
                    missing_cols = expected_cols - actual_cols
                    
                    if missing_cols:
                        structure_issues.append(f"❌ {table_name}: Missing columns {missing_cols}")
                    else:
                        print(f"✅ {table_name}: OK ({len(columns)} columns)")
                except Exception as e:
                    structure_issues.append(f"❌ {table_name}: Error - {str(e)[:50]}")
        
        if structure_issues:
            print("\n⚠️  Structure Issues:")
            for issue in structure_issues:
                print(f"   {issue}")
        
        # 3. Data integrity check
        print("\n" + "=" * 80)
        print("DATA INTEGRITY CHECK")
        print("=" * 80)
        
        integrity_issues = await check_data_integrity(session)
        if not integrity_issues:
            print("✅ No data integrity issues found")
        else:
            for issue in integrity_issues:
                print(f"   {issue}")
        
        # 4. Statistics
        print("\n" + "=" * 80)
        print("DATABASE STATISTICS")
        print("=" * 80)
        
        stats = await get_table_stats(session)
        print("\nRecord counts:")
        for table, count in stats.items():
            print(f"   {table}: {count:,} records" if isinstance(count, int) else f"   {table}: {count}")
        
        # Final summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        
        total_issues = len(missing) + len(structure_issues) + len(integrity_issues)
        
        if total_issues == 0:
            print("\n✅ Database health check PASSED - All checks successful!")
            print("\nYour database is properly configured and ready for production use.")
        else:
            print(f"\n⚠️  Database health check found {total_issues} issue(s)")
            print("   Please review the issues above and address them as needed.")

if __name__ == "__main__":
    asyncio.run(main())

