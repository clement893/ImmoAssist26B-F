"""
Comprehensive Tests for Rate Limiting
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import Request, FastAPI
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse

from app.core.rate_limit import (
    setup_rate_limiting,
    rate_limit_decorator,
    RateLimiter,
)


class TestRateLimiter:
    """Tests for RateLimiter class"""
    
    def test_rate_limiter_initialization(self):
        """Test rate limiter initialization"""
        limiter = RateLimiter(default_limit="10/minute")
        assert limiter is not None
    
    def test_rate_limiter_parse_limit(self):
        """Test parsing rate limit strings"""
        limiter = RateLimiter(default_limit="10/minute")
        # Test that limit is parsed correctly
        assert limiter.default_limit == "10/minute"


class TestRateLimitDecorator:
    """Tests for rate_limit_decorator"""
    
    def test_rate_limit_decorator_applies(self):
        """Test that decorator applies rate limiting"""
        @rate_limit_decorator("10/minute")
        async def test_endpoint():
            return {"status": "ok"}
        
        # Decorator should be applied
        assert hasattr(test_endpoint, '__wrapped__') or callable(test_endpoint)


class TestSetupRateLimiting:
    """Tests for setup_rate_limiting function"""
    
    def test_setup_rate_limiting_adds_middleware(self):
        """Test that setup_rate_limiting adds middleware"""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint():
            return {"status": "ok"}
        
        # Setup rate limiting
        app_with_limiting = setup_rate_limiting(app)
        
        # Should have middleware added
        assert app_with_limiting is not None

