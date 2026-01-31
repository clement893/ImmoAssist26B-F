"""
Tests for Cache Headers Middleware
"""

import pytest
from unittest.mock import AsyncMock, Mock
from fastapi import Request, FastAPI
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse

from app.core.cache_headers import CacheHeadersMiddleware


class TestCacheHeadersMiddleware:
    """Tests for CacheHeadersMiddleware"""
    
    @pytest.fixture
    def app(self):
        """Create test FastAPI app"""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        @app.get("/no-cache")
        async def no_cache_endpoint():
            response = JSONResponse(content={"message": "test"})
            response.headers["Cache-Control"] = "no-cache"
            return response
        
        return app
    
    def test_cache_headers_middleware_adds_default(self, app):
        """Test cache headers middleware adds default cache headers"""
        app.add_middleware(CacheHeadersMiddleware, default_max_age=300)
        client = TestClient(app)
        
        response = client.get("/test")
        assert response.status_code == 200
        # Cache-Control header should be set
        assert "Cache-Control" in response.headers
    
    def test_cache_headers_middleware_respects_existing(self, app):
        """Test cache headers middleware respects existing cache headers"""
        app.add_middleware(CacheHeadersMiddleware, default_max_age=300)
        client = TestClient(app)
        
        response = client.get("/no-cache")
        assert response.status_code == 200
        # Should respect existing no-cache header
        assert "no-cache" in response.headers.get("Cache-Control", "")

