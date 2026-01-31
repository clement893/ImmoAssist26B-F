"""
Integration tests for security audit logging flow
Tests complete audit trail for security events
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security_audit import (
    SecurityAuditLogger,
    SecurityAuditLog,
    SecurityEventType,
)
from app.models.user import User
from app.services.api_key_service import APIKeyService


@pytest.mark.integration
@pytest.mark.asyncio
class TestSecurityAuditFlow:
    """Integration tests for security audit logging"""
    
    async def test_authentication_audit_trail(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test complete authentication audit trail"""
        # Login success
        success_log = await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description="User logged in successfully",
            user_id=test_user.id,
            user_email=test_user.email,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
            success="success",
        )
        
        assert success_log.event_type == "login_success"
        assert success_log.severity == "info"
        
        # Login failure
        failure_log = await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGIN_FAILURE,
            description="Failed login attempt",
            user_email="wrong@example.com",
            ip_address="192.168.1.1",
            success="failure",
            metadata={"reason": "invalid_password"},
        )
        
        assert failure_log.event_type == "login_failure"
        assert failure_log.severity == "error"
        
        # Query audit trail
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.user_id == test_user.id)
            .order_by(SecurityAuditLog.timestamp.desc())
        )
        logs = list(result.scalars().all())
        
        assert len(logs) >= 1
        assert logs[0].event_type == "login_success"
    
    async def test_api_key_lifecycle_audit_trail(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test API key lifecycle audit trail"""
        # Create API key
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Audit Test Key",
        )
        
        # Verify creation was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == api_key.id)
            .where(SecurityAuditLog.event_type == "api_key_created")
        )
        create_log = result.scalar_one_or_none()
        assert create_log is not None
        
        # Rotate API key
        new_key, _ = await APIKeyService.rotate_api_key(
            db=db,
            api_key_id=api_key.id,
            user=test_user,
        )
        
        # Verify rotation was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == new_key.id)
            .where(SecurityAuditLog.event_type == "api_key_rotated")
        )
        rotate_log = result.scalar_one_or_none()
        assert rotate_log is not None
        
        # Revoke API key
        await APIKeyService.revoke_api_key(
            db=db,
            api_key_id=new_key.id,
            user=test_user,
        )
        
        # Verify revocation was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == new_key.id)
            .where(SecurityAuditLog.event_type == "api_key_revoked")
        )
        revoke_log = result.scalar_one_or_none()
        assert revoke_log is not None
        
        # Get all audit logs for this API key
        result = await db.execute(
            select(SecurityAuditLog)
            .where(
                (SecurityAuditLog.api_key_id == api_key.id) |
                (SecurityAuditLog.api_key_id == new_key.id)
            )
            .order_by(SecurityAuditLog.timestamp.asc())
        )
        all_logs = list(result.scalars().all())
        
        # Should have at least: created, rotated, revoked
        event_types = [log.event_type for log in all_logs]
        assert "api_key_created" in event_types
        assert "api_key_rotated" in event_types
        assert "api_key_revoked" in event_types
    
    async def test_suspicious_activity_detection(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test suspicious activity detection and logging"""
        # Log multiple failed login attempts
        for i in range(5):
            await SecurityAuditLogger.log_authentication_event(
                db=db,
                event_type=SecurityEventType.LOGIN_FAILURE,
                description=f"Failed login attempt {i+1}",
                user_email=test_user.email,
                ip_address="192.168.1.100",
                success="failure",
            )
        
        # Log suspicious activity
        suspicious_log = await SecurityAuditLogger.log_suspicious_activity(
            db=db,
            description="Multiple failed login attempts from same IP",
            user_email=test_user.email,
            ip_address="192.168.1.100",
            metadata={
                "failed_attempts": 5,
                "time_window": "5 minutes",
            },
        )
        
        assert suspicious_log.event_type == "suspicious_activity"
        assert suspicious_log.severity == "warning"
        assert suspicious_log.metadata["failed_attempts"] == 5
        
        # Query suspicious activity logs
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.event_type == "suspicious_activity")
            .order_by(SecurityAuditLog.timestamp.desc())
        )
        suspicious_logs = list(result.scalars().all())
        
        assert len(suspicious_logs) >= 1
        assert suspicious_logs[0].ip_address == "192.168.1.100"
    
    async def test_audit_log_retention_and_querying(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test audit log retention and querying capabilities"""
        # Create multiple audit logs
        events = [
            SecurityEventType.LOGIN_SUCCESS,
            SecurityEventType.PASSWORD_CHANGE,
            SecurityEventType.LOGOUT,
        ]
        
        for event_type in events:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=event_type,
                description=f"Test {event_type.value}",
                user_id=test_user.id,
                user_email=test_user.email,
            )
        
        # Query by event type
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.event_type == "login_success")
        )
        login_logs = list(result.scalars().all())
        assert len(login_logs) >= 1
        
        # Query by user
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.user_id == test_user.id)
        )
        user_logs = list(result.scalars().all())
        assert len(user_logs) >= 3
        
        # Query by severity
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.severity == "info")
        )
        info_logs = list(result.scalars().all())
        assert len(info_logs) >= 3

