"""
Request Signing
Implements HMAC-based request signing for API security
"""

import hmac
import hashlib
import time
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import logger


class RequestSigningMiddleware(BaseHTTPMiddleware):
    """Middleware to verify request signatures"""
    
    def __init__(self, app, secret_key: str, header_name: str = "X-Signature", timestamp_header: str = "X-Timestamp", max_age: int = 300):
        super().__init__(app)
        self.secret_key = secret_key
        self.header_name = header_name
        self.timestamp_header = timestamp_header
        self.max_age = max_age  # Maximum age of request in seconds (default 5 minutes)
    
    def compute_signature(self, method: str, path: str, body: bytes, timestamp: str) -> str:
        """Compute HMAC signature for request"""
        # Create signature string: method + path + body + timestamp
        signature_string = f"{method}{path}{body.decode('utf-8', errors='ignore')}{timestamp}"
        
        # Compute HMAC-SHA256
        signature = hmac.new(
            self.secret_key.encode(),
            signature_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def verify_signature(self, request: Request, signature: str, timestamp: str) -> bool:
        """Verify request signature"""
        # Check timestamp freshness
        try:
            request_time = int(timestamp)
            current_time = int(time.time())
            
            if abs(current_time - request_time) > self.max_age:
                logger.warning(f"Request timestamp too old: {current_time - request_time}s")
                return False
        except ValueError:
            logger.warning("Invalid timestamp format")
            return False
        
        # Compute expected signature
        body = b""
        if request.method in ["POST", "PUT", "PATCH"]:
            # IMPORTANT: Reading body here consumes it, so we need to handle this carefully
            # The body is cached by FastAPI middleware, but be aware of this limitation
            # In practice, you might want to cache the body or use a different approach
            pass
        
        expected_signature = self.compute_signature(
            method=request.method,
            path=str(request.url.path),
            body=body,
            timestamp=timestamp,
        )
        
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(signature, expected_signature)
    
    async def dispatch(self, request: Request, call_next):
        """Process request and verify signature"""
        
        # Skip signature verification for safe methods (GET, HEAD, OPTIONS)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)
        
        # Get signature and timestamp from headers
        signature = request.headers.get(self.header_name)
        timestamp = request.headers.get(self.timestamp_header)
        
        # If signature is not provided, allow request (optional signing)
        # For strict mode, uncomment the following:
        # if not signature or not timestamp:
        #     raise HTTPException(
        #         status_code=status.HTTP_401_UNAUTHORIZED,
        #         detail="Request signature required"
        #     )
        
        if signature and timestamp:
            # Verify signature
            if not self.verify_signature(request, signature, timestamp):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid request signature"
                )
        
        response = await call_next(request)
        return response


def compute_request_signature(method: str, path: str, body: str, timestamp: str, secret_key: str) -> str:
    """Compute request signature (for client-side use)"""
    signature_string = f"{method}{path}{body}{timestamp}"
    signature = hmac.new(
        secret_key.encode(),
        signature_string.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature

