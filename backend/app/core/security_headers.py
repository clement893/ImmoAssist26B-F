"""
Security Headers Middleware
Adds security headers to all HTTP responses
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses.
    
    Implements security best practices including:
    - Strict Transport Security (HSTS)
    - Content Security Policy (CSP)
    - X-Content-Type-Options
    - X-Frame-Options
    - X-XSS-Protection
    - Referrer-Policy
    - Permissions-Policy
    """
    
    def __init__(
        self,
        app: ASGIApp,
        force_https: bool = True,
        strict_transport_security: bool = True,
    ):
        super().__init__(app)
        self.force_https = force_https
        self.strict_transport_security = strict_transport_security
    
    async def dispatch(self, request: Request, call_next):
        """Process request and add security headers to response."""
        # Force HTTPS in production
        if self.force_https and settings.ENVIRONMENT == "production":
            if request.url.scheme != "https":
                logger.warning(f"Insecure request detected: {request.url}")
        
        response: Response = await call_next(request)
        self._add_security_headers(response, request)
        return response
    
    def _add_security_headers(self, response: Response, request: Request):
        """Add security headers to response."""
        # Strict Transport Security (HSTS)
        if self.strict_transport_security and settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Content Security Policy
        # 
        # SECURITY: CSP is relaxed in development (unsafe-inline/unsafe-eval)
        # In production, use strict CSP without unsafe-inline/unsafe-eval
        # See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
        # 
        # For production, consider using nonces:
        # script-src 'self' 'nonce-{nonce}';
        # style-src 'self' 'nonce-{nonce}';
        if settings.ENVIRONMENT == "production":
            # Strict CSP for production
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self'; "  # No unsafe-inline/unsafe-eval in production
                "style-src 'self'; "  # No unsafe-inline in production
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "object-src 'none'; "
                "upgrade-insecure-requests"
            )
        else:
            # Relaxed CSP for development
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Development only
                "style-src 'self' 'unsafe-inline'; "  # Development only
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
        response.headers["Content-Security-Policy"] = csp_policy
        
        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        response.headers["X-Frame-Options"] = "DENY"
        
        # X-XSS-Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer-Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy
        permissions_policy = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "speaker=()"
        )
        response.headers["Permissions-Policy"] = permissions_policy
        
        # Remove server header
        if "server" in response.headers:
            del response.headers["server"]
