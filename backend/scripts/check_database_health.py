"""
Database Health Check Script
Comprehensive check of database structure and integrity
"""

import sys
import psycopg2
from urllib.parse import urlparse
from typing import Dict, List, Tuple

DATABASE_URL = sys.argv[1] if len(sys.argv) > 1 else None

if not DATABASE_URL:
    print("Usage: python check_database_health.py <database_url>")
    sys.exit(1)

# Parse database URL
parsed = urlparse(DATABASE_URL)
db_config = {
    'host': parsed.hostname,
    'port': parsed.port,
    'database': parsed.path[1:],
    'user': parsed.username,
    'password': parsed.password
}

# Expected tables and their critical columns
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

def check_connection(conn):
    """Test database connection"""
    try:
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        print(f"✅ Database connection successful")
        print(f"   PostgreSQL version: {version.split(',')[0]}")
        cur.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_tables_exist(conn) -> Tuple[bool, List[str], List[str]]:
    """Check if all expected tables exist"""
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    existing_tables = {row[0] for row in cur.fetchall()}
    expected = set(EXPECTED_TABLES.keys())
    
    missing = expected - existing_tables
    extra = existing_tables - expected
    
    cur.close()
    return len(missing) == 0, list(missing), list(extra)

def check_table_structure(conn, table_name: str) -> Dict:
    """Check table structure"""
    cur = conn.cursor()
    
    # Get columns
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    columns = {row[0]: {'type': row[1], 'nullable': row[2] == 'YES', 'default': row[3]} 
               for row in cur.fetchall()}
    
    # Get indexes
    cur.execute("""
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = %s;
    """, (table_name,))
    indexes = [row[0] for row in cur.fetchall()]
    
    # Get foreign keys
    cur.execute("""
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = %s;
    """, (table_name,))
    foreign_keys = [(row[0], row[1], row[2]) for row in cur.fetchall()]
    
    cur.close()
    return {
        'columns': columns,
        'indexes': indexes,
        'foreign_keys': foreign_keys
    }

def check_data_integrity(conn) -> List[str]:
    """Check for data integrity issues"""
    issues = []
    cur = conn.cursor()
    
    # Check for duplicate emails
    cur.execute("""
        SELECT email, COUNT(*) as count
        FROM users
        GROUP BY email
        HAVING COUNT(*) > 1;
    """)
    duplicates = cur.fetchall()
    if duplicates:
        issues.append(f"❌ Duplicate emails found: {len(duplicates)}")
    
    # Check for orphaned subscriptions
    cur.execute("""
        SELECT COUNT(*) FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE u.id IS NULL;
    """)
    orphaned = cur.fetchone()[0]
    if orphaned > 0:
        issues.append(f"❌ Orphaned subscriptions: {orphaned}")
    
    # Check for orphaned team members
    cur.execute("""
        SELECT COUNT(*) FROM team_members tm
        LEFT JOIN teams t ON tm.team_id = t.id
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE t.id IS NULL OR u.id IS NULL;
    """)
    orphaned = cur.fetchone()[0]
    if orphaned > 0:
        issues.append(f"❌ Orphaned team members: {orphaned}")
    
    # Check for expired invitations that are still pending
    cur.execute("""
        SELECT COUNT(*) FROM invitations
        WHERE status = 'pending' AND expires_at < NOW();
    """)
    expired = cur.fetchone()[0]
    if expired > 0:
        issues.append(f"⚠️  Expired pending invitations: {expired}")
    
    # Check for multiple active themes
    cur.execute("""
        SELECT COUNT(*) FROM themes WHERE is_active = true;
    """)
    active_themes = cur.fetchone()[0]
    if active_themes > 1:
        issues.append(f"⚠️  Multiple active themes: {active_themes} (should be 1)")
    
    cur.close()
    return issues

def check_indexes(conn) -> List[str]:
    """Check for missing indexes on foreign keys"""
    issues = []
    cur = conn.cursor()
    
    cur.execute("""
        SELECT
            tc.table_name,
            kcu.column_name,
            CASE WHEN idx.indexname IS NULL THEN 'MISSING' ELSE 'OK' END as index_status
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN pg_indexes idx 
            ON idx.tablename = tc.table_name 
            AND idx.indexdef LIKE '%' || kcu.column_name || '%'
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND idx.indexname IS NULL;
    """)
    
    missing_indexes = cur.fetchall()
    if missing_indexes:
        for table, column, status in missing_indexes:
            issues.append(f"⚠️  Missing index on {table}.{column}")
    
    cur.close()
    return issues

def main():
    """Main health check function"""
    print("=" * 80)
    print("DATABASE HEALTH CHECK")
    print("=" * 80)
    print(f"\nConnecting to: {db_config['host']}:{db_config['port']}/{db_config['database']}\n")
    
    try:
        conn = psycopg2.connect(**db_config)
        
        # 1. Connection check
        if not check_connection(conn):
            sys.exit(1)
        
        print("\n" + "=" * 80)
        print("TABLE EXISTENCE CHECK")
        print("=" * 80)
        
        # 2. Check tables exist
        all_exist, missing, extra = check_tables_exist(conn)
        
        if all_exist:
            print(f"\n✅ All {len(EXPECTED_TABLES)} expected tables exist")
        else:
            print(f"\n❌ Missing tables ({len(missing)}):")
            for table in missing:
                print(f"   - {table}")
        
        if extra:
            print(f"\nℹ️  Extra tables ({len(extra)}):")
            for table in extra:
                print(f"   - {table}")
        
        # 3. Check table structures
        print("\n" + "=" * 80)
        print("TABLE STRUCTURE CHECK")
        print("=" * 80)
        
        structure_issues = []
        for table_name in sorted(EXPECTED_TABLES.keys()):
            if table_name not in missing:
                structure = check_table_structure(conn, table_name)
                expected_cols = EXPECTED_TABLES[table_name]
                actual_cols = set(structure['columns'].keys())
                missing_cols = set(expected_cols) - actual_cols
                
                if missing_cols:
                    structure_issues.append(f"❌ {table_name}: Missing columns {missing_cols}")
                else:
                    print(f"✅ {table_name}: Structure OK ({len(structure['columns'])} columns, {len(structure['indexes'])} indexes)")
        
        if structure_issues:
            print("\n⚠️  Structure Issues:")
            for issue in structure_issues:
                print(f"   {issue}")
        
        # 4. Check indexes
        print("\n" + "=" * 80)
        print("INDEX CHECK")
        print("=" * 80)
        
        index_issues = check_indexes(conn)
        if not index_issues:
            print("✅ All foreign keys have indexes")
        else:
            print("⚠️  Missing indexes:")
            for issue in index_issues:
                print(f"   {issue}")
        
        # 5. Data integrity check
        print("\n" + "=" * 80)
        print("DATA INTEGRITY CHECK")
        print("=" * 80)
        
        integrity_issues = check_data_integrity(conn)
        if not integrity_issues:
            print("✅ No data integrity issues found")
        else:
            for issue in integrity_issues:
                print(f"   {issue}")
        
        # 6. Summary statistics
        print("\n" + "=" * 80)
        print("DATABASE STATISTICS")
        print("=" * 80)
        
        cur = conn.cursor()
        
        # Count records in each table
        print("\nRecord counts:")
        for table in sorted(EXPECTED_TABLES.keys()):
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                count = cur.fetchone()[0]
                print(f"   {table}: {count:,} records")
            except Exception as e:
                print(f"   {table}: Error - {e}")
        
        # Get total indexes
        cur.execute("SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';")
        index_count = cur.fetchone()[0]
        print(f"\nTotal indexes: {index_count}")
        
        # Get total foreign keys
        cur.execute("""
            SELECT COUNT(*) FROM information_schema.table_constraints
            WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
        """)
        fk_count = cur.fetchone()[0]
        print(f"Total foreign keys: {fk_count}")
        
        cur.close()
        conn.close()
        
        # Final summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        
        total_issues = len(missing) + len(structure_issues) + len(index_issues) + len(integrity_issues)
        
        if total_issues == 0:
            print("\n✅ Database health check PASSED - All checks successful!")
        else:
            print(f"\n⚠️  Database health check found {total_issues} issue(s)")
            print("   Please review the issues above and address them as needed.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

