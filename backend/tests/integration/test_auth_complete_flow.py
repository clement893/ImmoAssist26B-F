"""
Complete authentication flow integration tests
"""

import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core.auth import verify_password, get_password_hash, create_access_token
from app.core.security_audit import SecurityAuditLogger, SecurityEventType, SecurityAuditLog


@pytest.mark.integration
@pytest.mark.asyncio
class TestCompleteAuthFlow:
    """Complete authentication flow tests"""
    
    async def test_registration_to_login_flow(
        self,
        db: AsyncSession,
    ):
        """Test complete flow from registration to login"""
        # 1. Register new user
        email = f"newuser-{datetime.utcnow().timestamp()}@example.com"
        password = "SecurePassword123!"
        
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            first_name="New",
            last_name="User",
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Log registration event
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description="User registered",
            user_id=user.id,
            user_email=user.email,
            success="success",
        )
        
        # 2. Verify password
        assert verify_password(password, user.hashed_password) is True
        
        # 3. Create access token
        token = create_access_token({"sub": user.email})
        assert token is not None
        
        # 4. Verify audit log was created
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.user_id == user.id)
        )
        logs = list(result.scalars().all())
        assert len(logs) >= 1
    
    async def test_login_failure_tracking(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test tracking of failed login attempts"""
        # Log multiple failed attempts
        for i in range(3):
            await SecurityAuditLogger.log_authentication_event(
                db=db,
                event_type=SecurityEventType.LOGIN_FAILURE,
                description=f"Failed login attempt {i+1}",
                user_email=test_user.email,
                ip_address="192.168.1.1",
                success="failure",
                metadata={"attempt": i + 1},
            )
        
        # Query failed attempts
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.event_type == "login_failure")
            .where(SecurityAuditLog.user_email == test_user.email)
        )
        failures = list(result.scalars().all())
        
        assert len(failures) == 3
        
        # After 3 failures, log suspicious activity
        await SecurityAuditLogger.log_suspicious_activity(
            db=db,
            description="Multiple failed login attempts",
            user_email=test_user.email,
            ip_address="192.168.1.1",
            metadata={"failed_attempts": 3},
        )
        
        # Verify suspicious activity was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.event_type == "suspicious_activity")
        )
        suspicious = list(result.scalars().all())
        assert len(suspicious) >= 1
    
    async def test_password_change_flow(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test password change flow"""
        old_password = "testpassword123"
        new_password = "NewSecurePassword123!"
        
        # Verify old password works
        assert verify_password(old_password, test_user.hashed_password) is True
        
        # Change password
        test_user.hashed_password = get_password_hash(new_password)
        await db.commit()
        await db.refresh(test_user)
        
        # Log password change
        await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.PASSWORD_CHANGE,
            description="Password changed",
            user_id=test_user.id,
            user_email=test_user.email,
            success="success",
        )
        
        # Verify new password works
        assert verify_password(new_password, test_user.hashed_password) is True
        
        # Verify old password doesn't work
        assert verify_password(old_password, test_user.hashed_password) is False
        
        # Verify audit log
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.event_type == "password_change")
            .where(SecurityAuditLog.user_id == test_user.id)
        )
        logs = list(result.scalars().all())
        assert len(logs) >= 1

