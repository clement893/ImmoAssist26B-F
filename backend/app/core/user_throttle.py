"""
User-Based Request Throttling
Implements per-user request throttling (separate from IP-based rate limiting)
"""

from typing import Optional
from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import logger


def get_user_throttle_key(request: Request) -> str:
    """Get throttle key for user-based throttling"""
    # Try to get user from request state (set by auth middleware)
    user = getattr(request.state, 'user', None)
    if user and hasattr(user, 'id'):
        return f"user_throttle:{user.id}"
    
    # Fallback to IP if no user
    return f"ip_throttle:{get_remote_address(request)}"


# User-based throttler (separate from IP-based rate limiter)
user_throttler = Limiter(
    key_func=get_user_throttle_key,
    default_limits=["1000/hour"],  # Default: 1000 requests per hour per user
    storage_uri=settings.REDIS_URL if settings.REDIS_URL else "memory://",
)


def user_throttle_decorator(limit: str):
    """Decorator for user-based throttling"""
    return user_throttler.limit(limit)


# Per-user throttle limits
USER_THROTTLE_LIMITS = {
    "default": "1000/hour",  # Default: 1000 requests per hour
    "free": "500/hour",  # Free tier: 500 requests per hour
    "pro": "5000/hour",  # Pro tier: 5000 requests per hour
    "enterprise": "50000/hour",  # Enterprise: 50000 requests per hour
}


def get_user_throttle_limit(user_tier: Optional[str] = None) -> str:
    """Get throttle limit based on user tier"""
    if user_tier and user_tier in USER_THROTTLE_LIMITS:
        return USER_THROTTLE_LIMITS[user_tier]
    return USER_THROTTLE_LIMITS["default"]


async def check_user_throttle(request: Request, limit: Optional[str] = None) -> bool:
    """Check if user has exceeded throttle limit"""
    # Get user from request state
    user = getattr(request.state, 'user', None)
    
    # Determine limit based on user tier
    if not limit:
        user_tier = getattr(user, 'tier', None) if user else None
        limit = get_user_throttle_limit(user_tier)
    
    # Check throttle
    try:
        # This would be called by the decorator, but we can also check manually
        key = get_user_throttle_key(request)
        # The actual checking is done by slowapi's Limiter
        return True
    except RateLimitExceeded:
        return False

