"""
Test script to verify LOGOUT and LOGIN_FAILURE audit logs
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.logging import logger
from sqlalchemy import select, func
from app.core.security_audit import SecurityAuditLog


async def test_logout_and_login_failure():
    """Test LOGOUT and LOGIN_FAILURE logging"""
    print("🧪 Testing LOGOUT and LOGIN_FAILURE audit logs...\n")
    
    # Test LOGOUT
    print("1️⃣ Testing LOGOUT event...")
    try:
        result = await SecurityAuditLogger.log_authentication_event(
            db=None,  # Use separate session
            event_type=SecurityEventType.LOGOUT,
            description="Test: User logged out",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            request_method="POST",
            request_path="/api/v1/auth/logout",
            success="success"
        )
        if result:
            print(f"   ✅ LOGOUT logged successfully (ID: {result.id})")
        else:
            print("   ❌ LOGOUT logging returned None")
    except Exception as e:
        print(f"   ❌ LOGOUT logging failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Test LOGIN_FAILURE
    print("\n2️⃣ Testing LOGIN_FAILURE event...")
    try:
        result = await SecurityAuditLogger.log_authentication_event(
            db=None,  # Use separate session
            event_type=SecurityEventType.LOGIN_FAILURE,
            description="Test: Failed login attempt",
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            request_method="POST",
            request_path="/api/v1/auth/login",
            success="failure",
            metadata={"reason": "invalid_credentials"}
        )
        if result:
            print(f"   ✅ LOGIN_FAILURE logged successfully (ID: {result.id})")
        else:
            print("   ❌ LOGIN_FAILURE logging returned None")
    except Exception as e:
        print(f"   ❌ LOGIN_FAILURE logging failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Verify logs in database
    print("\n3️⃣ Verifying logs in database...")
    db = AsyncSessionLocal()
    try:
        # Count LOGOUT events
        result = await db.execute(
            select(func.count(SecurityAuditLog.id))
            .where(SecurityAuditLog.event_type == "logout")
        )
        logout_count = result.scalar() or 0
        print(f"   📊 LOGOUT events in DB: {logout_count}")
        
        # Count LOGIN_FAILURE events
        result = await db.execute(
            select(func.count(SecurityAuditLog.id))
            .where(SecurityAuditLog.event_type == "login_failure")
        )
        failure_count = result.scalar() or 0
        print(f"   📊 LOGIN_FAILURE events in DB: {failure_count}")
        
        # Get recent events
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.event_type.in_(["logout", "login_failure"]))
            .order_by(SecurityAuditLog.timestamp.desc())
            .limit(5)
        )
        recent_events = result.scalars().all()
        
        if recent_events:
            print(f"\n   📋 Recent events ({len(recent_events)}):")
            for event in recent_events:
                print(f"      - {event.event_type} | {event.description} | ID: {event.id} | {event.timestamp}")
        else:
            print("   ⚠️  No recent LOGOUT or LOGIN_FAILURE events found")
            
    except Exception as e:
        print(f"   ❌ Error querying database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close()
    
    print("\n✅ Test completed!")


if __name__ == "__main__":
    asyncio.run(test_logout_and_login_failure())

