"""
Request Size Limits Middleware
Prevents DoS attacks by limiting request body size
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request body size"""
    
    # Default limits (in bytes)
    DEFAULT_LIMIT = 10 * 1024 * 1024  # 10 MB
    JSON_LIMIT = 1 * 1024 * 1024  # 1 MB for JSON
    FILE_UPLOAD_LIMIT = 50 * 1024 * 1024  # 50 MB for file uploads
    
    def __init__(self, app, default_limit: int = None, json_limit: int = None, file_upload_limit: int = None):
        super().__init__(app)
        self.default_limit = default_limit or self.DEFAULT_LIMIT
        self.json_limit = json_limit or self.JSON_LIMIT
        self.file_upload_limit = file_upload_limit or self.FILE_UPLOAD_LIMIT
    
    async def dispatch(self, request: Request, call_next):
        """Check request size before processing"""
        
        content_length = request.headers.get("content-length")
        
        if content_length:
            try:
                size = int(content_length)
                content_type = request.headers.get("content-type", "").lower()
                
                # Determine limit based on content type
                if "multipart/form-data" in content_type or "application/octet-stream" in content_type:
                    limit = self.file_upload_limit
                elif "application/json" in content_type:
                    limit = self.json_limit
                else:
                    limit = self.default_limit
                
                if size > limit:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Request body too large. Maximum size: {limit / (1024 * 1024):.1f} MB"
                    )
            except ValueError:
                # Invalid content-length header, continue
                pass
        
        response = await call_next(request)
        return response

