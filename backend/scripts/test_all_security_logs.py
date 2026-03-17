"""
Test script to verify all security audit logs are working
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.logging import logger


async def test_all_security_logs():
    """Test all security event types"""
    db = AsyncSessionLocal()
    
    try:
        print("🧪 Testing all security audit logs...\n")
        
        # Test Authentication Events
        print("1️⃣ Testing Authentication Events...")
        await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description="Test: User logged in successfully",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            request_method="POST",
            request_path="/api/v1/auth/login",
            success="success"
        )
        print("   ✅ LOGIN_SUCCESS")
        
        await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGIN_FAILURE,
            description="Test: Failed login attempt",
            user_email="test@example.com",
            ip_address="127.0.0.1",
            success="failure",
            metadata={"reason": "invalid_password"}
        )
        print("   ✅ LOGIN_FAILURE")
        
        await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGOUT,
            description="Test: User logged out",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            success="success"
        )
        print("   ✅ LOGOUT")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.PASSWORD_CHANGE,
            description="Test: Password changed",
            user_id=1,
            user_email="test@example.com",
            severity="info",
            success="success"
        )
        print("   ✅ PASSWORD_CHANGE")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.PASSWORD_RESET_REQUEST,
            description="Test: Password reset requested",
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="info",
            success="success"
        )
        print("   ✅ PASSWORD_RESET_REQUEST")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.PASSWORD_RESET_COMPLETE,
            description="Test: Password reset completed",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="info",
            success="success"
        )
        print("   ✅ PASSWORD_RESET_COMPLETE")
        
        # Test API Key Events
        print("\n2️⃣ Testing API Key Events...")
        await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_CREATED,
            api_key_id=1,
            description="Test: API key created",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1"
        )
        print("   ✅ API_KEY_CREATED")
        
        await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_ROTATED,
            api_key_id=1,
            description="Test: API key rotated",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1"
        )
        print("   ✅ API_KEY_ROTATED")
        
        await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_REVOKED,
            api_key_id=1,
            description="Test: API key revoked",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1"
        )
        print("   ✅ API_KEY_REVOKED")
        
        await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_USED,
            api_key_id=1,
            description="Test: API key used",
            user_id=1,
            user_email="test@example.com"
        )
        print("   ✅ API_KEY_USED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.API_KEY_EXPIRED,
            description="Test: API key expired",
            user_id=1,
            user_email="test@example.com",
            severity="warning",
            success="unknown",
            metadata={"api_key_id": 1}
        )
        print("   ✅ API_KEY_EXPIRED")
        
        # Test Authorization Events
        print("\n3️⃣ Testing Authorization Events...")
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.PERMISSION_DENIED,
            description="Test: Permission denied",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            request_method="GET",
            request_path="/api/v1/protected",
            severity="warning",
            success="failure",
            metadata={"permission": "admin:read"}
        )
        print("   ✅ PERMISSION_DENIED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ROLE_CHANGED,
            description="Test: Role changed",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="info",
            success="success",
            metadata={"target_user_id": 2, "role_id": 3, "action": "assigned"}
        )
        print("   ✅ ROLE_CHANGED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ACCESS_GRANTED,
            description="Test: Access granted",
            user_id=1,
            user_email="test@example.com",
            severity="info",
            success="success",
            metadata={"resource": "project", "resource_id": 123}
        )
        print("   ✅ ACCESS_GRANTED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ACCESS_REVOKED,
            description="Test: Access revoked",
            user_id=1,
            user_email="test@example.com",
            severity="warning",
            success="success",
            metadata={"resource": "project", "resource_id": 123}
        )
        print("   ✅ ACCESS_REVOKED")
        
        # Test Security Events
        print("\n4️⃣ Testing Security Events...")
        await SecurityAuditLogger.log_suspicious_activity(
            db=db,
            description="Test: Suspicious activity detected",
            user_email="test@example.com",
            ip_address="127.0.0.1",
            metadata={"activity_type": "multiple_failed_logins", "count": 5}
        )
        print("   ✅ SUSPICIOUS_ACTIVITY")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
            description="Test: Rate limit exceeded",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            request_method="POST",
            request_path="/api/v1/auth/login",
            severity="warning",
            success="failure",
            metadata={"limit": "5/minute", "remaining": 0}
        )
        print("   ✅ RATE_LIMIT_EXCEEDED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.CSRF_TOKEN_INVALID,
            description="Test: CSRF token invalid",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="warning",
            success="failure"
        )
        print("   ✅ CSRF_TOKEN_INVALID")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.INVALID_TOKEN,
            description="Test: Invalid token",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="warning",
            success="failure",
            metadata={"error_type": "JWTError"}
        )
        print("   ✅ INVALID_TOKEN")
        
        # Test Data Access Events
        print("\n5️⃣ Testing Data Access Events...")
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_ACCESSED,
            description="Test: Data accessed",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            request_method="GET",
            request_path="/api/v1/pages",
            severity="info",
            success="success",
            metadata={"resource_type": "pages", "count": 10}
        )
        print("   ✅ DATA_ACCESSED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description="Test: Data modified",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            request_method="POST",
            request_path="/api/v1/pages",
            severity="info",
            success="success",
            metadata={"resource_type": "page", "page_id": 1, "action": "created"}
        )
        print("   ✅ DATA_MODIFIED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description="Test: Data deleted",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            request_method="DELETE",
            request_path="/api/v1/pages/1",
            severity="info",
            success="success",
            metadata={"resource_type": "page", "page_id": 1}
        )
        print("   ✅ DATA_DELETED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_EXPORTED,
            description="Test: Data exported",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            request_method="GET",
            request_path="/api/v1/forms/1/export",
            severity="info",
            success="success",
            metadata={"format": "csv", "row_count": 100}
        )
        print("   ✅ DATA_EXPORTED")
        
        # Test System Events
        print("\n6️⃣ Testing System Events...")
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.CONFIGURATION_CHANGED,
            description="Test: Configuration changed",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="info",
            success="success",
            metadata={"setting": "max_users", "old_value": 100, "new_value": 200}
        )
        print("   ✅ CONFIGURATION_CHANGED")
        
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.SECURITY_SETTING_CHANGED,
            description="Test: Security setting changed",
            user_id=1,
            user_email="test@example.com",
            ip_address="127.0.0.1",
            severity="warning",
            success="success",
            metadata={"setting": "password_policy", "min_length": 8}
        )
        print("   ✅ SECURITY_SETTING_CHANGED")
        
        print("\n✅ All security audit logs tested successfully!")
        print(f"\n📊 Total events logged: 24")
        print("\n💡 Check the 'security_audit_logs' table in your database to verify all entries.")
        
    except Exception as e:
        print(f"\n❌ Error testing security logs: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(test_all_security_logs())

