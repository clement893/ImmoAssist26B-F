"""
CSRF Protection Middleware
Implements double-submit cookie pattern for CSRF protection
"""

import secrets
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware


class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection middleware using double-submit cookie pattern"""
    
    def __init__(self, app, secret_key: str, cookie_name: str = "csrf_token"):
        super().__init__(app)
        self.secret_key = secret_key
        self.cookie_name = cookie_name
        self.header_name = "X-CSRF-Token"
    
    async def dispatch(self, request: Request, call_next):
        """Process request and validate CSRF token"""
        
        # Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            response = await call_next(request)
            # Generate and set CSRF token cookie for safe methods
            csrf_token = secrets.token_urlsafe(32)
            response.set_cookie(
                key=self.cookie_name,
                value=csrf_token,
                httponly=False,  # Must be readable by JavaScript for double-submit
                secure=request.url.scheme == "https",
                samesite="strict",
                max_age=3600,  # 1 hour
            )
            return response
        
        # Skip CSRF for API endpoints that use JWT authentication
        # CSRF protection is not needed for API endpoints using Bearer tokens
        # as they are protected by CORS and JWT validation
        path = request.url.path
        if path.startswith("/api/") or path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
            # For API endpoints, skip CSRF check but still set cookie for browser-based requests
            response = await call_next(request)
            # Optionally set CSRF token cookie for API endpoints too
            csrf_token = secrets.token_urlsafe(32)
            response.set_cookie(
                key=self.cookie_name,
                value=csrf_token,
                httponly=False,
                secure=request.url.scheme == "https",
                samesite="strict",
                max_age=3600,
            )
            return response
        
        # For unsafe methods (POST, PUT, DELETE, PATCH) on non-API endpoints, validate CSRF token
        csrf_token_cookie = request.cookies.get(self.cookie_name)
        csrf_token_header = request.headers.get(self.header_name)
        
        # Both cookie and header must be present and match
        if not csrf_token_cookie or not csrf_token_header:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing"
            )
        
        if csrf_token_cookie != csrf_token_header:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token mismatch"
            )
        
        # CSRF validation passed, continue
        response = await call_next(request)
        return response


def generate_csrf_token() -> str:
    """Generate a secure CSRF token"""
    return secrets.token_urlsafe(32)


def validate_csrf_token(token_cookie: Optional[str], token_header: Optional[str]) -> bool:
    """Validate CSRF token (double-submit pattern)"""
    if not token_cookie or not token_header:
        return False
    return token_cookie == token_header
