"""
Unit tests for security audit logging
"""

import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security_audit import (
    SecurityAuditLogger,
    SecurityAuditLog,
    SecurityEventType,
)
from app.models.user import User


@pytest.mark.unit
@pytest.mark.asyncio
class TestSecurityAuditLogger:
    """Test security audit logger"""
    
    async def test_log_event(self, db: AsyncSession, test_user: User):
        """Test logging a security event"""
        audit_log = await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description="User logged in successfully",
            user_id=test_user.id,
            user_email=test_user.email,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
            request_method="POST",
            request_path="/api/auth/login",
            severity="info",
            success="success",
            metadata={"login_method": "password"},
        )
        
        assert audit_log.id is not None
        assert audit_log.event_type == "login_success"
        assert audit_log.user_id == test_user.id
        assert audit_log.user_email == test_user.email
        assert audit_log.ip_address == "192.168.1.1"
        assert audit_log.severity == "info"
        assert audit_log.success == "success"
        assert audit_log.metadata == {"login_method": "password"}
    
    async def test_log_api_key_event(self, db: AsyncSession, test_user: User):
        """Test logging API key event"""
        from app.services.api_key_service import APIKeyService
        
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Test Key",
        )
        
        audit_log = await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_CREATED,
            api_key_id=api_key.id,
            description=f"API key '{api_key.name}' created",
            user_id=test_user.id,
            user_email=test_user.email,
            ip_address="192.168.1.1",
        )
        
        assert audit_log.event_type == "api_key_created"
        assert audit_log.api_key_id == api_key.id
        assert audit_log.user_id == test_user.id
    
    async def test_log_authentication_event(self, db: AsyncSession):
        """Test logging authentication event"""
        audit_log = await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGIN_FAILURE,
            description="Failed login attempt",
            user_email="test@example.com",
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
            success="failure",
            metadata={"reason": "invalid_password"},
        )
        
        assert audit_log.event_type == "login_failure"
        assert audit_log.severity == "error"
        assert audit_log.success == "failure"
    
    async def test_log_suspicious_activity(self, db: AsyncSession, test_user: User):
        """Test logging suspicious activity"""
        audit_log = await SecurityAuditLogger.log_suspicious_activity(
            db=db,
            description="Multiple failed login attempts",
            user_email=test_user.email,
            ip_address="192.168.1.1",
            metadata={
                "failed_attempts": 5,
                "time_window": "5 minutes",
            },
        )
        
        assert audit_log.event_type == "suspicious_activity"
        assert audit_log.severity == "warning"
        assert audit_log.success == "failure"
        assert audit_log.metadata["failed_attempts"] == 5
    
    async def test_query_audit_logs(self, db: AsyncSession, test_user: User):
        """Test querying audit logs"""
        # Create multiple audit logs
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description="Login 1",
            user_id=test_user.id,
        )
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.LOGIN_FAILURE,
            description="Login 2",
            user_id=test_user.id,
        )
        
        # Query logs for user
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.user_id == test_user.id)
            .order_by(SecurityAuditLog.timestamp.desc())
        )
        logs = list(result.scalars().all())
        
        assert len(logs) >= 2
        assert logs[0].user_id == test_user.id
    
    async def test_audit_log_severity_levels(self, db: AsyncSession):
        """Test different severity levels"""
        # Info
        info_log = await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description="Info event",
            severity="info",
        )
        assert info_log.severity == "info"
        
        # Warning
        warning_log = await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            description="Warning event",
            severity="warning",
        )
        assert warning_log.severity == "warning"
        
        # Error
        error_log = await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.LOGIN_FAILURE,
            description="Error event",
            severity="error",
        )
        assert error_log.severity == "error"
        
        # Critical
        critical_log = await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            description="Critical event",
            severity="critical",
        )
        assert critical_log.severity == "critical"


@pytest.mark.unit
class TestSecurityEventType:
    """Test security event type enum"""
    
    def test_event_types_exist(self):
        """Test that all event types are defined"""
        assert SecurityEventType.LOGIN_SUCCESS
        assert SecurityEventType.LOGIN_FAILURE
        assert SecurityEventType.API_KEY_CREATED
        assert SecurityEventType.API_KEY_ROTATED
        assert SecurityEventType.API_KEY_REVOKED
        assert SecurityEventType.SUSPICIOUS_ACTIVITY
    
    def test_event_type_values(self):
        """Test event type string values"""
        assert SecurityEventType.LOGIN_SUCCESS.value == "login_success"
        assert SecurityEventType.API_KEY_CREATED.value == "api_key_created"
        assert SecurityEventType.SUSPICIOUS_ACTIVITY.value == "suspicious_activity"

