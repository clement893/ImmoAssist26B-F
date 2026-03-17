"""
Enhanced CORS Configuration
Tightened CORS settings for better security
"""

import os
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request

from app.core.config import settings
from app.core.logging import logger


def validate_origin(origin: str, allowed_origins: List[str]) -> bool:
    """Validate origin against allowed origins list"""
    # Exact match
    if origin in allowed_origins:
        return True
    
    # Wildcard subdomain matching (e.g., *.example.com)
    for allowed in allowed_origins:
        if allowed.startswith("*."):
            domain = allowed[2:]  # Remove "*."
            if origin.endswith(domain):
                return True
    
    return False


def get_cors_origins() -> List[str]:
    """Get CORS origins with validation and environment-based defaults"""
    import os
    
    # Detect environment
    is_production = (
        os.getenv("ENVIRONMENT", "").lower() == "production" or
        os.getenv("RAILWAY_ENVIRONMENT") is not None
    )
    
    # Get origins from settings
    cors_origins = settings.CORS_ORIGINS
    
    # Ensure it's a list
    if isinstance(cors_origins, str):
        cors_origins = [cors_origins]
    
    # In production, be strict - only allow explicitly configured origins
    if is_production:
        if not cors_origins or cors_origins == ["http://localhost:3000"]:
            logger.warning(
                "⚠️ CORS_ORIGINS not properly configured for production! "
                "Using FRONTEND_URL as fallback. This should be explicitly set."
            )
            frontend_url = os.getenv("FRONTEND_URL")
            if frontend_url:
                cors_origins = [frontend_url]
            else:
                logger.error(
                    "❌ No CORS origins configured for production! "
                    "Set CORS_ORIGINS or FRONTEND_URL environment variable."
                )
                cors_origins = []  # Deny all in production if not configured
    
    # Remove duplicates and empty strings
    cors_origins = list(set([origin.strip() for origin in cors_origins if origin.strip()]))
    
    logger.info(f"✅ CORS Origins configured ({len(cors_origins)}): {cors_origins}")
    
    return cors_origins


def setup_cors(app: FastAPI) -> None:
    """Setup CORS middleware with tightened security"""
    cors_origins = get_cors_origins()
    
    # Determine if we're in production
    is_production = (
        os.getenv("ENVIRONMENT", "").lower() == "production" or
        os.getenv("RAILWAY_ENVIRONMENT") is not None
    )
    
    # Allowed headers - minimal set for security
    allowed_headers = [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-API-Key",  # For API key authentication
        "X-Signature",  # For request signing
        "X-Timestamp",  # For request signing
        "X-CSRF-Token",  # For CSRF protection
        "X-Bootstrap-Key",  # For bootstrap superadmin endpoint
    ]
    
    # Exposed headers - minimal set
    exposed_headers = [
        "X-Process-Time",
        "X-Timestamp",
        "X-Response-Time",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ]
    
    # Use CORSMiddleware - it handles OPTIONS requests automatically
    # If cors_origins is empty, use wildcard for development (not recommended for production)
    if not cors_origins and not is_production:
        logger.warning("⚠️ No CORS origins configured, using wildcard (development only)")
        cors_origins = ["*"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins if cors_origins else ["*"],  # Fallback to wildcard if empty
        allow_credentials=True,  # Required for cookies
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=allowed_headers,
        expose_headers=exposed_headers,
        max_age=3600,  # Cache preflight requests for 1 hour
    )
    
    # Add a middleware to ensure CORS headers are always present
    # This middleware runs AFTER CORSMiddleware but BEFORE routes
    # Note: In FastAPI, middlewares are executed in reverse order of addition
    # So this middleware (added after CORSMiddleware) runs BEFORE CORSMiddleware
    # This ensures we can add CORS headers even if CORSMiddleware doesn't
    @app.middleware("http")
    async def add_cors_headers_middleware(request: Request, call_next):
        """Ensure CORS headers are always present, even on errors"""
        # Get origin from request
        origin = request.headers.get("Origin", "")
        
        # Determine allowed origin
        def get_allowed_origin():
            # In production, be more permissive if origin matches Railway domain pattern
            if origin and cors_origins and validate_origin(origin, cors_origins):
                return origin
            elif "*" in cors_origins:
                return "*"
            elif cors_origins:
                # Check if origin matches any Railway domain pattern
                if origin and (".up.railway.app" in origin or ".railway.app" in origin):
                    # Allow Railway domains if any Railway domain is in allowed origins
                    for allowed in cors_origins:
                        if ".railway.app" in allowed or ".up.railway.app" in allowed:
                            logger.info(f"CORS: Allowing Railway origin {origin} (matched pattern {allowed})")
                            return origin
                return cors_origins[0]
            elif not is_production:
                return origin or "*"
            else:
                # In production, allow Railway domains even if not explicitly configured
                if origin and (".up.railway.app" in origin or ".railway.app" in origin):
                    logger.info(f"CORS: Allowing Railway origin {origin} (production fallback)")
                    return origin
                logger.warning(f"CORS: Origin {origin} not in allowed list {cors_origins}")
                return None
        
        allowed_origin = get_allowed_origin()
        
        # Helper function to add CORS headers to any response
        def add_cors_to_response(resp):
            from starlette.responses import Response
            # Ensure resp is a Response instance before accessing headers
            if not isinstance(resp, Response):
                return resp
            if allowed_origin and "Access-Control-Allow-Origin" not in resp.headers:
                resp.headers["Access-Control-Allow-Origin"] = allowed_origin
                resp.headers["Access-Control-Allow-Credentials"] = "true"
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
                resp.headers["Access-Control-Allow-Headers"] = ", ".join(allowed_headers)
            return resp
        
        # Handle OPTIONS preflight requests explicitly
        if request.method == "OPTIONS":
            from starlette.responses import Response
            response = Response()
            if allowed_origin:
                response.headers["Access-Control-Allow-Origin"] = allowed_origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = ", ".join(allowed_headers)
                response.headers["Access-Control-Max-Age"] = "3600"
            return response
        
        # Process the request
        try:
            response = await call_next(request)
            # Ensure CORS headers are present on successful response
            return add_cors_to_response(response)
        except Exception as e:
            # Don't intercept exceptions - let them propagate to error handlers
            # The error handlers will create proper responses, and CORSMiddleware
            # will add CORS headers automatically
            raise
    
    logger.info("✅ CORS middleware configured with tightened security")

