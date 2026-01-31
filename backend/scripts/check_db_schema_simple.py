"""
Simple Database Schema Checker using psycopg2
"""

import sys
import psycopg2
from urllib.parse import urlparse

DATABASE_URL = sys.argv[1] if len(sys.argv) > 1 else None

if not DATABASE_URL:
    print("Usage: python check_db_schema_simple.py <database_url>")
    sys.exit(1)

# Parse database URL
parsed = urlparse(DATABASE_URL)
db_config = {
    'host': parsed.hostname,
    'port': parsed.port,
    'database': parsed.path[1:],  # Remove leading /
    'user': parsed.username,
    'password': parsed.password
}

try:
    print("🔍 Connecting to database...")
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    print("\n📊 Analyzing database schema...\n")
    
    # Get all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    
    print("=" * 80)
    print("DATABASE SCHEMA REVIEW")
    print("=" * 80)
    print(f"\n📋 Found {len(tables)} tables:")
    for table in tables:
        print(f"   ✓ {table}")
    
    # Expected tables
    expected_tables = {
        'users', 'roles', 'permissions', 'role_permissions', 'user_roles',
        'teams', 'team_members', 'invitations',
        'plans', 'subscriptions', 'invoices',
        'projects', 'themes', 'files', 'api_keys', 'webhook_events'
    }
    
    actual_tables = set(tables)
    missing = expected_tables - actual_tables
    extra = actual_tables - expected_tables
    
    print("\n" + "=" * 80)
    print("TABLE COMPARISON")
    print("=" * 80)
    
    if missing:
        print(f"\n⚠️  MISSING TABLES ({len(missing)}):")
        for t in sorted(missing):
            print(f"   - {t}")
    else:
        print("\n✅ All expected tables exist")
    
    if extra:
        print(f"\nℹ️  EXTRA TABLES ({len(extra)}):")
        for t in sorted(extra):
            print(f"   - {t}")
    
    # Check critical tables structure
    print("\n" + "=" * 80)
    print("CRITICAL TABLE STRUCTURE CHECKS")
    print("=" * 80)
    
    critical_checks = []
    
    # Check users table
    if 'users' in tables:
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position;
        """)
        users_cols = {row[0]: (row[1], row[2]) for row in cur.fetchall()}
        
        required_users_cols = ['id', 'email', 'hashed_password', 'is_active', 'created_at', 'updated_at']
        missing_cols = [col for col in required_users_cols if col not in users_cols]
        
        if missing_cols:
            critical_checks.append(f"❌ users table missing columns: {', '.join(missing_cols)}")
        else:
            print("✅ users table structure OK")
            print(f"   Columns: {len(users_cols)}")
    else:
        critical_checks.append("❌ users table not found!")
    
    # Check indexes
    print("\n" + "=" * 80)
    print("INDEX ANALYSIS")
    print("=" * 80)
    
    cur.execute("""
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
    """)
    indexes = cur.fetchall()
    
    index_by_table = {}
    for table, idx_name, idx_def in indexes:
        if table not in index_by_table:
            index_by_table[table] = []
        index_by_table[table].append((idx_name, idx_def))
    
    for table in sorted(index_by_table.keys()):
        idx_list = index_by_table[table]
        print(f"\n📋 {table}: {len(idx_list)} indexes")
        for idx_name, idx_def in idx_list[:3]:  # Show first 3
            print(f"   - {idx_name}")
        if len(idx_list) > 3:
            print(f"   ... and {len(idx_list) - 3} more")
    
    # Check foreign keys
    print("\n" + "=" * 80)
    print("FOREIGN KEY ANALYSIS")
    print("=" * 80)
    
    cur.execute("""
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
    """)
    foreign_keys = cur.fetchall()
    
    fk_by_table = {}
    for table, col, ref_table, ref_col in foreign_keys:
        if table not in fk_by_table:
            fk_by_table[table] = []
        fk_by_table[table].append((col, ref_table, ref_col))
    
    for table in sorted(fk_by_table.keys()):
        fk_list = fk_by_table[table]
        print(f"\n📋 {table}: {len(fk_list)} foreign keys")
        for col, ref_table, ref_col in fk_list:
            print(f"   - {col} → {ref_table}.{ref_col}")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if critical_checks:
        print("\n❌ CRITICAL ISSUES:")
        for issue in critical_checks:
            print(f"   {issue}")
    else:
        print("\n✅ No critical issues found!")
    
    print(f"\n📊 Database Statistics:")
    print(f"   - Tables: {len(tables)}")
    print(f"   - Indexes: {len(indexes)}")
    print(f"   - Foreign Keys: {len(foreign_keys)}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

