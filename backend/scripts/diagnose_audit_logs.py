"""
Diagnostic script to check why audit logs are not being saved
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text, inspect
from app.core.database import engine, AsyncSessionLocal
from app.core.security_audit import SecurityAuditLog, SecurityAuditLogger, SecurityEventType
from app.core.logging import logger


async def diagnose():
    """Run diagnostics on audit logging"""
    print("=" * 70)
    print("SECURITY AUDIT LOGS DIAGNOSTIC")
    print("=" * 70)
    
    async with AsyncSessionLocal() as db:
        # 1. Check if table exists
        print("\n1. Checking if table exists...")
        try:
            result = await db.execute(
                text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_audit_logs')")
            )
            table_exists = result.scalar()
            if table_exists:
                print("   ✅ Table 'security_audit_logs' EXISTS")
            else:
                print("   ❌ Table 'security_audit_logs' DOES NOT EXIST")
                print("   ⚠️  Run migration: alembic upgrade head")
                return False
        except Exception as e:
            print(f"   ❌ Error checking table: {e}")
            return False
        
        # 2. Check table structure
        print("\n2. Checking table structure...")
        try:
            result = await db.execute(
                text("""
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'security_audit_logs'
                    ORDER BY ordinal_position
                """)
            )
            columns = result.fetchall()
            if columns:
                print("   ✅ Table has columns:")
                for col in columns:
                    print(f"      - {col[0]} ({col[1]}, nullable: {col[2]})")
            else:
                print("   ⚠️  Table exists but has no columns")
        except Exception as e:
            print(f"   ❌ Error checking structure: {e}")
        
        # 3. Count existing records
        print("\n3. Counting existing records...")
        try:
            result = await db.execute(text("SELECT COUNT(*) FROM security_audit_logs"))
            count = result.scalar()
            print(f"   Current record count: {count}")
            if count > 0:
                print("   ✅ Table has records")
            else:
                print("   ⚠️  Table is empty")
        except Exception as e:
            print(f"   ❌ Error counting records: {e}")
        
        # 4. Test creating a log entry
        print("\n4. Testing log creation...")
        try:
            print("   Attempting to create test audit log...")
            audit_log = await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.LOGIN_SUCCESS,
                description="Diagnostic test - verifying audit logging works",
                user_id=999,
                user_email="diagnostic@test.com",
                ip_address="127.0.0.1",
                user_agent="diagnostic-script",
                request_method="POST",
                request_path="/test",
                severity="info",
                success="success",
                metadata={"test": True, "diagnostic": True}
            )
            print(f"   ✅ Log created with ID: {audit_log.id}")
            print(f"   Event Type: {audit_log.event_type}")
            print(f"   Description: {audit_log.description}")
            
            # Verify it was saved
            print("\n5. Verifying log was saved to database...")
            await db.refresh(audit_log)
            result = await db.execute(
                text("SELECT id, event_type, description FROM security_audit_logs WHERE id = :id"),
                {"id": audit_log.id}
            )
            saved_log = result.fetchone()
            if saved_log:
                print(f"   ✅ Log found in database!")
                print(f"      ID: {saved_log[0]}")
                print(f"      Event Type: {saved_log[1]}")
                print(f"      Description: {saved_log[2]}")
                return True
            else:
                print("   ❌ Log was created but NOT found in database!")
                print("   ⚠️  This indicates a commit issue")
                return False
                
        except Exception as e:
            print(f"   ❌ ERROR creating log: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return False
        
        # 6. Check recent logs
        print("\n6. Checking recent logs (last 5)...")
        try:
            result = await db.execute(
                text("""
                    SELECT id, event_type, description, timestamp, user_email 
                    FROM security_audit_logs 
                    ORDER BY timestamp DESC 
                    LIMIT 5
                """)
            )
            logs = result.fetchall()
            if logs:
                print("   Recent logs:")
                for log in logs:
                    print(f"      - [{log[3]}] {log[1]}: {log[2]} (User: {log[4]})")
            else:
                print("   ⚠️  No logs found")
        except Exception as e:
            print(f"   ❌ Error checking recent logs: {e}")


if __name__ == "__main__":
    result = asyncio.run(diagnose())
    print("\n" + "=" * 70)
    if result:
        print("✅ DIAGNOSTIC COMPLETE - Audit logging appears to be working")
    else:
        print("❌ DIAGNOSTIC COMPLETE - Issues found, see above")
    print("=" * 70)
    sys.exit(0 if result else 1)

