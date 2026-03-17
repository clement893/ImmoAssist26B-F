# Security Audit Logging

## Overview

Comprehensive security audit logging system that tracks all security-related events for compliance, forensics, and security monitoring.

## Event Types

### Authentication Events

- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILURE` - Failed login attempt
- `LOGOUT` - User logout
- `PASSWORD_CHANGE` - Password changed
- `PASSWORD_RESET_REQUEST` - Password reset requested
- `PASSWORD_RESET_COMPLETE` - Password reset completed

### API Key Events

- `API_KEY_CREATED` - API key created
- `API_KEY_ROTATED` - API key rotated
- `API_KEY_REVOKED` - API key revoked
- `API_KEY_USED` - API key used for authentication
- `API_KEY_EXPIRED` - API key expired or needs rotation

### Authorization Events

- `PERMISSION_DENIED` - Access denied due to permissions
- `ROLE_CHANGED` - User role changed
- `ACCESS_GRANTED` - Access granted
- `ACCESS_REVOKED` - Access revoked

### Security Events

- `SUSPICIOUS_ACTIVITY` - Suspicious activity detected
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `CSRF_TOKEN_INVALID` - Invalid CSRF token
- `INVALID_TOKEN` - Invalid authentication token

### Data Access Events

- `DATA_ACCESSED` - Data accessed
- `DATA_MODIFIED` - Data modified
- `DATA_DELETED` - Data deleted
- `DATA_EXPORTED` - Data exported

### System Events

- `CONFIGURATION_CHANGED` - System configuration changed
- `SECURITY_SETTING_CHANGED` - Security setting changed

## Usage

### Basic Logging

```python
from app.core.security_audit import SecurityAuditLogger, SecurityEventType

# Log a security event
await SecurityAuditLogger.log_event(
    db=db,
    event_type=SecurityEventType.LOGIN_SUCCESS,
    description="User logged in successfully",
    user_id=user.id,
    user_email=user.email,
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent"),
    request_method=request.method,
    request_path=str(request.url.path),
    severity="info",
    success="success",
    metadata={"login_method": "password"}
)
```

### API Key Events

```python
# Log API key creation
await SecurityAuditLogger.log_api_key_event(
    db=db,
    event_type=SecurityEventType.API_KEY_CREATED,
    api_key_id=api_key.id,
    description=f"API key '{api_key.name}' created",
    user_id=user.id,
    user_email=user.email,
    ip_address=request.client.host,
)
```

### Authentication Events

```python
# Log login failure
await SecurityAuditLogger.log_authentication_event(
    db=db,
    event_type=SecurityEventType.LOGIN_FAILURE,
    description="Failed login attempt",
    user_email=email,  # May be None for invalid users
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent"),
    success="failure",
    metadata={"reason": "invalid_password"}
)
```

### Suspicious Activity

```python
# Log suspicious activity
await SecurityAuditLogger.log_suspicious_activity(
    db=db,
    description="Multiple failed login attempts from same IP",
    user_email=email,
    ip_address=request.client.host,
    metadata={
        "failed_attempts": 5,
        "time_window": "5 minutes"
    }
)
```

## Severity Levels

- **`info`** - Informational events (default)
- **`warning`** - Warning events (e.g., suspicious activity)
- **`error`** - Error events (e.g., failed authentication)
- **`critical`** - Critical events (e.g., security breaches)

## Database Schema

The `security_audit_logs` table stores:

- `timestamp` - Event timestamp
- `event_type` - Type of security event
- `severity` - Event severity
- `user_id` - User ID (if applicable)
- `user_email` - User email (denormalized)
- `api_key_id` - API key ID (if applicable)
- `ip_address` - Client IP address
- `user_agent` - User agent string
- `request_method` - HTTP method
- `request_path` - Request path
- `description` - Human-readable description
- `metadata` - Additional structured data (JSON)
- `success` - Event result (success/failure/unknown)

## Querying Audit Logs

```python
from app.models.api_key import SecurityAuditLog
from sqlalchemy import select

# Get recent security events for a user
result = await db.execute(
    select(SecurityAuditLog)
    .where(SecurityAuditLog.user_id == user_id)
    .order_by(SecurityAuditLog.timestamp.desc())
    .limit(100)
)
events = result.scalars().all()

# Get suspicious activity
result = await db.execute(
    select(SecurityAuditLog)
    .where(SecurityAuditLog.event_type == "suspicious_activity")
    .order_by(SecurityAuditLog.timestamp.desc())
)
```

## Best Practices

1. **Log all security events** - Don't skip "minor" events
2. **Include context** - Always include IP, user agent, and request details
3. **Use appropriate severity** - Match severity to event importance
4. **Store metadata** - Use metadata field for structured data
5. **Retention policy** - Implement log retention and archival
6. **Monitor critical events** - Set up alerts for critical severity events
7. **Regular review** - Review audit logs regularly for anomalies

## Compliance

Security audit logging helps with:

- **SOC 2** - Security monitoring and incident response
- **GDPR** - Data access tracking
- **HIPAA** - Access logging requirements
- **PCI DSS** - Security event logging
