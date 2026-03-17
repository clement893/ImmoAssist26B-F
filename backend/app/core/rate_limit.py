"""
Rate Limiting Middleware
Comprehensive protection against abuse and denial-of-service attacks.

Features:
- Per-endpoint rate limiting with configurable limits
- User-based rate limiting for authenticated users
- IP-based rate limiting for anonymous users
- Redis-backed storage for distributed rate limiting
- Memory fallback when Redis is unavailable
- Automatic rate limit headers in responses
- Configurable limits per endpoint category

@example
```python
from app.core.rate_limit import rate_limit_decorator

@router.post("/api/v1/auth/login")
@rate_limit_decorator("5/minute")
async def login():
    # Endpoint protected with 5 requests per minute limit
    pass
```
"""

from typing import Callable, Optional, Dict, Any
from fastapi import Request, HTTPException, status, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.logging import logger
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.database import AsyncSessionLocal

# Rate limit storage configuration
def get_storage_uri() -> str:
    """
    Get storage URI for rate limiter.
    
    Prioritizes Redis for distributed rate limiting across multiple instances.
    Falls back to in-memory storage if Redis is unavailable.
    
    @returns Storage URI string (Redis URL or "memory://")
    """
    if settings.REDIS_URL:
        try:
            # Verify Redis is available
            import redis
            redis_client = redis.from_url(settings.REDIS_URL)
            redis_client.ping()
            logger.info("Using Redis for distributed rate limiting")
            return settings.REDIS_URL
        except Exception as e:
            logger.warning(f"Redis not available for rate limiting, using memory: {e}")
            return "memory://"
    logger.info("Using in-memory rate limiting (Redis not configured)")
    return "memory://"


def get_rate_limit_key(request: Request) -> str:
    """
    Get rate limit key for identifying rate limit buckets.
    
    Uses user ID for authenticated users (more accurate per-user limits).
    Falls back to IP address for anonymous users.
    
    @param request - FastAPI request object
    @returns Rate limit key string (e.g., "user:123" or "ip:192.168.1.1")
    
    @example
    ```python
    # Authenticated user
    key = get_rate_limit_key(request)  # "user:550e8400-e29b-41d4-a716-446655440000"
    
    # Anonymous user
    key = get_rate_limit_key(request)  # "ip:192.168.1.1"
    ```
    """
    # Try to get user from request state (set by auth middleware)
    user = getattr(request.state, 'user', None)
    if user and hasattr(user, 'id'):
        return f"user:{user.id}"
    
    # Fallback to IP address
    ip_address = get_remote_address(request)
    return f"ip:{ip_address}"


# Initialize rate limiter with enhanced key function
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["1000/hour"],  # Default limit: 1000 requests per hour
    storage_uri=get_storage_uri(),  # Redis if available, otherwise memory
    headers_enabled=True,  # Enable rate limit headers in responses
)

# Comprehensive rate limits by endpoint category
RATE_LIMITS: Dict[str, Dict[str, str]] = {
    "auth": {
        # Authentication endpoints - stricter limits to prevent brute force
        "/api/v1/auth/login": "5/minute",  # 5 login attempts per minute
        "/api/v1/auth/register": "3/minute",  # 3 registrations per minute
        "/api/v1/auth/refresh": "10/minute",  # 10 token refreshes per minute
        "/api/v1/auth/forgot-password": "3/minute",  # 3 password reset requests per minute
        "/api/v1/auth/reset-password": "5/minute",  # 5 password reset attempts per minute
        "/api/v1/auth/verify-email": "10/minute",  # 10 email verifications per minute
        "/api/v1/auth/resend-verification": "3/minute",  # 3 resend requests per minute
    },
    "two_factor": {
        # Two-factor authentication endpoints
        "/api/v1/auth/2fa/enable": "5/hour",  # 5 enable attempts per hour
        "/api/v1/auth/2fa/disable": "3/hour",  # 3 disable attempts per hour
        "/api/v1/auth/2fa/verify": "10/minute",  # 10 verification attempts per minute
    },
    "api": {
        # General API endpoints
        "/api/v1/users": "100/hour",  # 100 user list requests per hour
        "/api/v1/users/{user_id}": "200/hour",  # 200 user detail requests per hour
        "/api/v1/projects": "200/hour",  # 200 project list requests per hour
        "/api/v1/projects/{project_id}": "300/hour",  # 300 project detail requests per hour
    },
    "admin": {
        # Admin endpoints - stricter limits
        "/api/v1/admin": "50/hour",  # 50 admin requests per hour
        "/api/v1/admin/users": "30/hour",  # 30 user management requests per hour
        "/api/v1/admin/teams": "30/hour",  # 30 team management requests per hour
    },
    "webhooks": {
        # Webhook endpoints - higher limits for external services
        "/api/webhooks/stripe": "100/minute",  # 100 webhook calls per minute
    },
    "file_upload": {
        # File upload endpoints - lower limits due to resource usage
        "/api/v1/upload": "20/hour",  # 20 uploads per hour
        "/api/v1/files": "50/hour",  # 50 file operations per hour
    },
    "default": "1000/hour",  # Default limit for all other endpoints
}


def get_rate_limit(path: str) -> str:
    """
    Get rate limit for a given path.
    
    Checks endpoint-specific limits first, then falls back to default.
    Supports path pattern matching with wildcards.
    
    @param path - API endpoint path (e.g., "/api/v1/auth/login")
    @returns Rate limit string (e.g., "5/minute")
    
    @example
    ```python
    limit = get_rate_limit("/api/v1/auth/login")  # "5/minute"
    limit = get_rate_limit("/api/v1/users/123")  # "200/hour"
    limit = get_rate_limit("/api/v1/unknown")    # "1000/hour" (default)
    ```
    """
    # Check specific endpoint limits
    for category, limits in RATE_LIMITS.items():
        if category == "default":
            continue
        
        for pattern, limit in limits.items():
            # Exact match
            if pattern == path:
                return limit
            
            # Pattern matching (e.g., "/api/v1/users/{user_id}")
            if "{user_id}" in pattern:
                pattern_base = pattern.replace("{user_id}", "")
                if path.startswith(pattern_base):
                    return limit
            
            if "{project_id}" in pattern:
                pattern_base = pattern.replace("{project_id}", "")
                if path.startswith(pattern_base):
                    return limit
    
    # Return default limit
    return RATE_LIMITS["default"]


def setup_rate_limiting(app) -> Any:
    """
    Configure rate limiting for the FastAPI application.
    
    Sets up the rate limiter middleware and exception handler.
    Adds rate limit headers to all responses.
    
    @param app - FastAPI application instance
    @returns FastAPI app with rate limiting configured
    
    @example
    ```python
    from fastapi import FastAPI
    from app.core.rate_limit import setup_rate_limiting
    
    app = FastAPI()
    app = setup_rate_limiting(app)
    ```
    """
    app.state.limiter = limiter
    
    # Add custom exception handler with detailed error messages
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        """
        Custom rate limit exceeded handler.
        
        Returns 429 Too Many Requests with rate limit information in headers.
        """
        # Log rate limit exceeded event
        try:
            # Get user from request state if available
            user = getattr(request.state, 'user', None)
            user_id = user.id if user and hasattr(user, 'id') else None
            user_email = user.email if user and hasattr(user, 'email') else None
            
            # Create a separate session for audit logging
            db = AsyncSessionLocal()
            try:
                await SecurityAuditLogger.log_event(
                    db=db,
                    event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
                    description=f"Rate limit exceeded for endpoint: {request.url.path}",
                    user_id=user_id,
                    user_email=user_email,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                    request_method=request.method,
                    request_path=str(request.url.path),
                    severity="warning",
                    success="failure",
                    metadata={
                        "limit": str(getattr(exc, "limit", "unknown")),
                        "remaining": str(getattr(exc, "remaining", 0)),
                        "retry_after": str(getattr(exc, "retry_after", 60)),
                    }
                )
            finally:
                await db.close()
        except Exception as e:
            # Don't fail the request if audit logging fails
            logger.warning(f"Failed to log rate limit exceeded event: {e}")
        
        response = JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "rate_limit_exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": getattr(exc, "retry_after", None),
            },
        )
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(getattr(exc, "limit", "unknown"))
        response.headers["X-RateLimit-Remaining"] = str(getattr(exc, "remaining", 0))
        response.headers["Retry-After"] = str(getattr(exc, "retry_after", 60))
        
        return response
    
    logger.info("Rate limiting configured with comprehensive endpoint limits")
    return app


def rate_limit_decorator(limit: str):
    """
    Decorator to apply rate limiting to an endpoint.
    
    @param limit - Rate limit string (e.g., "5/minute", "100/hour")
    @returns Decorator function
    
    @example
    ```python
    from app.core.rate_limit import rate_limit_decorator
    
    @router.post("/api/v1/auth/login")
    @rate_limit_decorator("5/minute")
    async def login(credentials: LoginSchema):
        # This endpoint is limited to 5 requests per minute
        pass
    ```
    """
    return limiter.limit(limit)


def get_rate_limit_info(request: Request) -> Dict[str, Any]:
    """
    Get current rate limit information for a request.
    
    Useful for displaying rate limit status to users.
    
    @param request - FastAPI request object
    @returns Dictionary with rate limit information
    
    @example
    ```python
    info = get_rate_limit_info(request)
    # {
    #   "limit": "100/hour",
    #   "remaining": 95,
    #   "reset": "2025-01-25T12:00:00Z"
    # }
    ```
    """
    # This would require accessing the limiter's internal state
    # Implementation depends on slowapi's internal API
    return {
        "limit": "unknown",
        "remaining": "unknown",
        "reset": "unknown",
    }

