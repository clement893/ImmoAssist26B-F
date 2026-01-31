"""
Cache Headers Middleware
Adds Cache-Control and ETag headers to API responses
"""

from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
import hashlib
import json
from typing import Callable
from datetime import datetime, timedelta, timezone


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding cache headers to responses"""

    def __init__(self, app, default_max_age: int = 300):
        super().__init__(app)
        self.default_max_age = default_max_age

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip cache headers for non-GET requests
        if request.method != "GET":
            response = await call_next(request)
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response
        
        # Call the next middleware/endpoint
        response = await call_next(request)
        
        # Skip cache headers for error responses
        if response.status_code >= 400:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response
        
        # Get path from request URL (works with both Request and _CachedRequest)
        path = request.url.path if hasattr(request, 'url') else getattr(request, 'path', '/')
        
        # Skip ETag generation for responses without body attribute (e.g., StreamingResponse, RedirectResponse)
        if not hasattr(response, 'body'):
            # Still add cache headers but skip ETag
            max_age = self._get_cache_max_age(path)
            response.headers["Cache-Control"] = f"public, max-age={max_age}, must-revalidate"
            response.headers["Vary"] = "Accept, Accept-Encoding"
            expires = datetime.now(timezone.utc) + timedelta(seconds=max_age)
            response.headers["Expires"] = expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
            return response
        
        # Generate ETag from response body
        try:
            body = response.body
            etag = hashlib.md5(body).hexdigest()
            response.headers["ETag"] = f'"{etag}"'
            
            # Check if client sent If-None-Match header
            if_none_match = request.headers.get("If-None-Match")
            if if_none_match and if_none_match.strip() == f'"{etag}"':
                # Response hasn't changed, return 304 Not Modified
                return Response(status_code=304, headers=response.headers)
        except AttributeError:
            # Response doesn't have body attribute, skip ETag
            pass
        
        # Determine cache max-age based on endpoint
        max_age = self._get_cache_max_age(path)
        
        # Add cache headers
        response.headers["Cache-Control"] = f"public, max-age={max_age}, must-revalidate"
        response.headers["Vary"] = "Accept, Accept-Encoding"
        
        # Add Expires header
        expires = datetime.now(timezone.utc) + timedelta(seconds=max_age)
        response.headers["Expires"] = expires.strftime("%a, %d %b %Y %H:%M:%S GMT")
        
        return response

    def _get_cache_max_age(self, path: str) -> int:
        """Determine cache max-age based on endpoint"""
        # Static/rarely changing data - longer cache
        if "/health" in path or "/docs" in path:
            return 60  # 1 minute
        
        # User data - shorter cache
        if "/users/me" in path:
            return 60  # 1 minute
        
        # List endpoints - medium cache
        if "/users" in path and path.endswith("/users"):
            return 300  # 5 minutes
        
        # Individual resources - medium cache
        if "/users/" in path or "/resources/" in path:
            return 300  # 5 minutes
        
        # Default cache
        return self.default_max_age

