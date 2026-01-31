"""
Security Audit Logging
Comprehensive security event logging for audit trails
"""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from sqlalchemy import Column, DateTime, Integer, String, Text, JSON, Index, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base, AsyncSessionLocal
from app.core.logging import logger


class SecurityEventType(str, Enum):
    """Types of security events"""
    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    PASSWORD_RESET_COMPLETE = "password_reset_complete"
    
    # API Key events
    API_KEY_CREATED = "api_key_created"
    API_KEY_ROTATED = "api_key_rotated"
    API_KEY_REVOKED = "api_key_revoked"
    API_KEY_USED = "api_key_used"
    API_KEY_EXPIRED = "api_key_expired"
    
    # Authorization events
    PERMISSION_DENIED = "permission_denied"
    ROLE_CHANGED = "role_changed"
    ACCESS_GRANTED = "access_granted"
    ACCESS_REVOKED = "access_revoked"
    
    # Security events
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    CSRF_TOKEN_INVALID = "csrf_token_invalid"
    INVALID_TOKEN = "invalid_token"
    
    # Data access events
    DATA_ACCESSED = "data_accessed"
    DATA_MODIFIED = "data_modified"
    DATA_DELETED = "data_deleted"
    DATA_EXPORTED = "data_exported"
    
    # System events
    CONFIGURATION_CHANGED = "configuration_changed"
    SECURITY_SETTING_CHANGED = "security_setting_changed"


class SecurityAuditLog(Base):
    """Security audit log model"""
    __tablename__ = "security_audit_logs"
    __table_args__ = (
        Index("idx_security_audit_user_id", "user_id"),
        Index("idx_security_audit_event_type", "event_type"),
        Index("idx_security_audit_timestamp", "timestamp"),
        Index("idx_security_audit_ip_address", "ip_address"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="info", nullable=False)  # info, warning, error, critical
    
    # User context
    user_id = Column(Integer, nullable=True, index=True)
    user_email = Column(String(255), nullable=True)  # Denormalized for audit trail
    api_key_id = Column(Integer, nullable=True)  # If event was via API key
    
    # Request context
    ip_address = Column(String(45), nullable=True, index=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    request_method = Column(String(10), nullable=True)
    request_path = Column(String(500), nullable=True)
    
    # Event details
    description = Column(Text, nullable=False)
    event_metadata = Column("metadata", JSON, nullable=True)  # Additional structured data (DB column name: metadata)
    
    # Result
    success = Column(String(10), default="unknown", nullable=False)  # success, failure, unknown
    
    def __repr__(self) -> str:
        return f"<SecurityAuditLog(id={self.id}, event_type={self.event_type}, user_id={self.user_id}, timestamp={self.timestamp})>"


class SecurityAuditLogger:
    """Security audit logger"""
    
    @staticmethod
    async def log_event(
        db: Optional[AsyncSession] = None,
        event_type: SecurityEventType = None,
        description: str = None,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        api_key_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_method: Optional[str] = None,
        request_path: Optional[str] = None,
        severity: str = "info",
        success: str = "unknown",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[SecurityAuditLog]:
        """
        Log a security event
        
        Args:
            db: Database session
            event_type: Type of security event
            description: Human-readable description
            user_id: User ID (if applicable)
            user_email: User email (denormalized)
            api_key_id: API key ID (if event via API key)
            ip_address: Client IP address
            user_agent: User agent string
            request_method: HTTP method
            request_path: Request path
            severity: Event severity (info, warning, error, critical)
            success: Event result (success, failure, unknown)
            metadata: Additional structured data
        
        Returns:
            Created SecurityAuditLog record, or None if logging failed
        """
        # Use provided session or create a new one for audit logging
        # Creating a separate session ensures the log is saved even if the main transaction fails
        use_separate_session = db is None
        if use_separate_session:
            db = AsyncSessionLocal()
        
        try:
            audit_log = SecurityAuditLog(
                event_type=event_type.value,
                description=description,
                user_id=user_id,
                user_email=user_email,
                api_key_id=api_key_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request_method=request_method,
                request_path=request_path,
                severity=severity,
                success=success,
                event_metadata=metadata or {},
            )
            
            db.add(audit_log)
            # Commit immediately to ensure the audit log is saved
            # This is critical for security audit logs - they must be persisted
            await db.commit()
            await db.refresh(audit_log)
            
            # Also log to application logger
            log_context = {
                "audit_log_id": audit_log.id,
                "event_type": event_type.value,
                "user_id": user_id,
                "severity": severity,
            }
            
            if severity == "critical":
                logger.critical(f"Security audit: {description}", context=log_context)
            elif severity == "error":
                logger.error(f"Security audit: {description}", context=log_context)
            elif severity == "warning":
                logger.warning(f"Security audit: {description}", context=log_context)
            else:
                logger.info(f"Security audit: {description}", context=log_context)
            
            return audit_log
        except Exception as e:
            # Rollback on error
            try:
                await db.rollback()
            except Exception:
                pass  # Ignore rollback errors
            
            # Log the error with full context - make it very visible
            error_msg = (
                f"❌ FAILED TO CREATE SECURITY AUDIT LOG: {e}\n"
                f"   Event Type: {event_type.value}\n"
                f"   Description: {description}\n"
                f"   User ID: {user_id}\n"
                f"   User Email: {user_email}\n"
                f"   Error Type: {type(e).__name__}\n"
                f"   Error Details: {str(e)}"
            )
            logger.error(error_msg, exc_info=True)
            
            # Return None instead of raising - we don't want audit logging failures to break the app
            return None
        finally:
            # Close the session if we created it
            if use_separate_session:
                try:
                    await db.close()
                except Exception:
                    pass
    
    @staticmethod
    async def log_api_key_event(
        db: AsyncSession,
        event_type: SecurityEventType,
        api_key_id: int,
        description: str,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SecurityAuditLog:
        """Log API key-related security event"""
        return await SecurityAuditLogger.log_event(
            db=db,
            event_type=event_type,
            description=description,
            user_id=user_id,
            user_email=user_email,
            api_key_id=api_key_id,
            ip_address=ip_address,
            severity="info" if "created" in event_type.value else "warning",
            success="success",
            metadata=metadata,
        )
    
    @staticmethod
    async def log_authentication_event(
        db: Optional[AsyncSession] = None,
        event_type: SecurityEventType = None,
        description: str = None,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_method: Optional[str] = None,
        request_path: Optional[str] = None,
        success: str = "unknown",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[SecurityAuditLog]:
        """Log authentication-related security event"""
        severity = "error" if "failure" in event_type.value else "info"
        return await SecurityAuditLogger.log_event(
            db=db,
            event_type=event_type,
            description=description,
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            severity=severity,
            success=success,
            metadata=metadata,
        )
    
    @staticmethod
    async def log_suspicious_activity(
        db: AsyncSession,
        description: str,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> SecurityAuditLog:
        """Log suspicious activity"""
        return await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            description=description,
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            severity="warning",
            success="failure",
            metadata=metadata,
        )


# Convenience instance
security_audit_logger = SecurityAuditLogger()

