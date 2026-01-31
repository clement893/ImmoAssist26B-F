"""
Database Schema Checker
Compares production database schema with expected models
"""

import asyncio
import sys
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

# Database URL from environment or command line
DATABASE_URL = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Error: DATABASE_URL not provided")
    print("Usage: python check_database_schema.py <database_url>")
    sys.exit(1)

# Convert to async URL if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


async def get_table_info(engine):
    """Get information about all tables in the database"""
    async with engine.connect() as conn:
        # Get all table names
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result]
        
        table_info = {}
        for table in tables:
            # Get columns
            columns_result = await conn.execute(text(f"""
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = '{table}'
                ORDER BY ordinal_position;
            """))
            
            columns = []
            for col in columns_result:
                columns.append({
                    'name': col[0],
                    'type': col[1],
                    'max_length': col[2],
                    'nullable': col[3] == 'YES',
                    'default': col[4]
                })
            
            # Get indexes
            indexes_result = await conn.execute(text(f"""
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = '{table}'
                ORDER BY indexname;
            """))
            
            indexes = [{'name': row[0], 'definition': row[1]} for row in indexes_result]
            
            # Get foreign keys
            fk_result = await conn.execute(text(f"""
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_name = '{table}';
            """))
            
            foreign_keys = []
            for fk in fk_result:
                foreign_keys.append({
                    'constraint': fk[0],
                    'column': fk[1],
                    'references_table': fk[2],
                    'references_column': fk[3]
                })
            
            table_info[table] = {
                'columns': columns,
                'indexes': indexes,
                'foreign_keys': foreign_keys
            }
        
        return table_info


async def main():
    """Main function"""
    print("🔍 Connecting to database...")
    print(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")
    
    try:
        engine = create_async_engine(DATABASE_URL, echo=False)
        
        print("\n📊 Analyzing database schema...\n")
        table_info = await get_table_info(engine)
        
        # Expected tables from models
        expected_tables = {
            'users', 'roles', 'permissions', 'role_permissions', 'user_roles',
            'teams', 'team_members', 'invitations',
            'plans', 'subscriptions', 'invoices',
            'projects', 'themes', 'files', 'api_keys', 'webhook_events'
        }
        
        actual_tables = set(table_info.keys())
        
        print("=" * 80)
        print("TABLE ANALYSIS")
        print("=" * 80)
        
        # Check for missing tables
        missing_tables = expected_tables - actual_tables
        if missing_tables:
            print(f"\n⚠️  MISSING TABLES ({len(missing_tables)}):")
            for table in sorted(missing_tables):
                print(f"   - {table}")
        else:
            print("\n✅ All expected tables exist")
        
        # Check for extra tables
        extra_tables = actual_tables - expected_tables
        if extra_tables:
            print(f"\nℹ️  EXTRA TABLES ({len(extra_tables)}):")
            for table in sorted(extra_tables):
                print(f"   - {table}")
        
        # Detailed table information
        print("\n" + "=" * 80)
        print("DETAILED TABLE INFORMATION")
        print("=" * 80)
        
        for table_name in sorted(table_info.keys()):
            info = table_info[table_name]
            print(f"\n📋 Table: {table_name}")
            print(f"   Columns: {len(info['columns'])}")
            print(f"   Indexes: {len(info['indexes'])}")
            print(f"   Foreign Keys: {len(info['foreign_keys'])}")
            
            # Show columns
            if info['columns']:
                print("   Columns:")
                for col in info['columns']:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    max_len = f"({col['max_length']})" if col['max_length'] else ""
                    default = f" DEFAULT {col['default']}" if col['default'] else ""
                    print(f"     - {col['name']}: {col['type']}{max_len} {nullable}{default}")
            
            # Show indexes
            if info['indexes']:
                print("   Indexes:")
                for idx in info['indexes'][:5]:  # Show first 5
                    print(f"     - {idx['name']}")
                if len(info['indexes']) > 5:
                    print(f"     ... and {len(info['indexes']) - 5} more")
            
            # Show foreign keys
            if info['foreign_keys']:
                print("   Foreign Keys:")
                for fk in info['foreign_keys']:
                    print(f"     - {fk['column']} → {fk['references_table']}.{fk['references_column']}")
        
        # Check for common issues
        print("\n" + "=" * 80)
        print("SCHEMA HEALTH CHECKS")
        print("=" * 80)
        
        issues = []
        warnings = []
        
        # Check users table
        if 'users' in table_info:
            users_cols = {col['name'] for col in table_info['users']['columns']}
            if 'email' not in users_cols:
                issues.append("❌ users table missing 'email' column")
            if 'hashed_password' not in users_cols:
                issues.append("❌ users table missing 'hashed_password' column")
            if 'is_active' not in users_cols:
                warnings.append("⚠️  users table missing 'is_active' column")
        
        # Check for indexes on foreign keys
        for table_name, info in table_info.items():
            fk_columns = {fk['column'] for fk in info['foreign_keys']}
            indexed_columns = set()
            for idx in info['indexes']:
                # Extract column names from index definition
                idx_def = idx['definition'].lower()
                for col in fk_columns:
                    if col.lower() in idx_def:
                        indexed_columns.add(col)
            
            missing_fk_indexes = fk_columns - indexed_columns
            if missing_fk_indexes:
                warnings.append(f"⚠️  {table_name}: Foreign keys without indexes: {', '.join(missing_fk_indexes)}")
        
        if issues:
            print("\n❌ CRITICAL ISSUES:")
            for issue in issues:
                print(f"   {issue}")
        
        if warnings:
            print("\n⚠️  WARNINGS:")
            for warning in warnings:
                print(f"   {warning}")
        
        if not issues and not warnings:
            print("\n✅ No schema issues detected!")
        
        await engine.dispose()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

