"""
Test script to verify security audit logging is working
Run this script to test if audit logs can be created in the database
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.logging import logger


async def test_audit_logging():
    """Test creating an audit log entry"""
    print("=" * 60)
    print("Testing Security Audit Logging")
    print("=" * 60)
    
    async with AsyncSessionLocal() as db:
        try:
            print("\n1. Attempting to create test audit log...")
            
            audit_log = await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.LOGIN_SUCCESS,
                description="Test audit log entry - verifying logging works",
                user_id=999,
                user_email="test@example.com",
                ip_address="127.0.0.1",
                user_agent="test-script",
                request_method="POST",
                request_path="/test",
                severity="info",
                success="success",
                metadata={"test": True}
            )
            
            print(f"   ✓ Audit log created with ID: {audit_log.id}")
            
            # Commit the transaction
            print("\n2. Committing transaction...")
            await db.commit()
            print("   ✓ Transaction committed")
            
            # Verify the log was saved
            print("\n3. Verifying log was saved...")
            await db.refresh(audit_log)
            print(f"   ✓ Log verified - ID: {audit_log.id}, Event: {audit_log.event_type}")
            
            print("\n" + "=" * 60)
            print("✅ SUCCESS: Audit logging is working correctly!")
            print("=" * 60)
            return True
            
        except Exception as e:
            print(f"\n❌ ERROR: Failed to create audit log")
            print(f"   Error Type: {type(e).__name__}")
            print(f"   Error Message: {str(e)}")
            print(f"\n   Full traceback:")
            import traceback
            traceback.print_exc()
            
            # Try to rollback
            try:
                await db.rollback()
                print("\n   ✓ Transaction rolled back")
            except Exception as rollback_error:
                print(f"\n   ⚠️  Rollback failed: {rollback_error}")
            
            print("\n" + "=" * 60)
            print("❌ FAILED: Audit logging is not working")
            print("=" * 60)
            return False


if __name__ == "__main__":
    result = asyncio.run(test_audit_logging())
    sys.exit(0 if result else 1)

