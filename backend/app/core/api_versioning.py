"""
API Versioning Support
Handles API versioning through headers and URL paths
"""

from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger


class APIVersioningMiddleware(BaseHTTPMiddleware):
    """Middleware to handle API versioning"""
    
    def __init__(self, app, default_version: str = "v1", supported_versions: list = None):
        super().__init__(app)
        self.default_version = default_version
        self.supported_versions = supported_versions or ["v1"]
    
    def get_version_from_header(self, request: Request) -> Optional[str]:
        """Get API version from Accept header"""
        accept_header = request.headers.get("Accept", "")
        
        # Check for version in Accept header: application/vnd.api+json;version=v1
        if "version=" in accept_header:
            try:
                version_part = accept_header.split("version=")[1].split(";")[0].split(",")[0]
                version = version_part.strip()
                if version in self.supported_versions:
                    return version
            except (IndexError, ValueError):
                pass
        
        # Check for vendor-specific Accept header: application/vnd.api.v1+json
        for version in self.supported_versions:
            if f"application/vnd.api.{version}" in accept_header:
                return version
        
        return None
    
    def get_version_from_path(self, request: Request) -> Optional[str]:
        """Get API version from URL path"""
        path = str(request.url.path)
        
        # Check for /api/v1/, /api/v2/, etc.
        for version in self.supported_versions:
            if f"/api/{version}/" in path:
                return version
        
        return None
    
    def get_api_version(self, request: Request) -> str:
        """Get API version from request (header, path, or default)"""
        # Priority: path > header > default
        version = self.get_version_from_path(request)
        if version:
            return version
        
        version = self.get_version_from_header(request)
        if version:
            return version
        
        return self.default_version
    
    async def dispatch(self, request: Request, call_next):
        """Process request and add version info"""
        version = self.get_api_version(request)
        
        # Store version in request state
        request.state.api_version = version
        
        # Add version to response headers
        response = await call_next(request)
        response.headers["X-API-Version"] = version
        
        return response


def setup_api_versioning(app, default_version: str = "v1", supported_versions: list = None) -> None:
    """Setup API versioning middleware"""
    supported_versions = supported_versions or ["v1"]
    
    app.add_middleware(
        APIVersioningMiddleware,
        default_version=default_version,
        supported_versions=supported_versions,
    )
    
    logger.info(f"✅ API versioning enabled: default={default_version}, supported={supported_versions}")

