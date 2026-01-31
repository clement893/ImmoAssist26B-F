"""
Tests for Request Size Limits Middleware
"""

import pytest
from unittest.mock import AsyncMock, Mock
from fastapi import Request, FastAPI
from fastapi.testclient import TestClient
from fastapi.responses import JSONResponse

from app.core.request_limits import RequestSizeLimitMiddleware


class TestRequestSizeLimitMiddleware:
    """Tests for RequestSizeLimitMiddleware"""
    
    @pytest.fixture
    def app(self):
        """Create test FastAPI app"""
        app = FastAPI()
        
        @app.post("/test")
        async def test_endpoint(request: Request):
            body = await request.body()
            return {"received": len(body)}
        
        return app
    
    def test_request_size_limit_allows_small_request(self, app):
        """Test middleware allows requests within size limit"""
        app.add_middleware(RequestSizeLimitMiddleware, default_limit=1024 * 1024)  # 1MB
        client = TestClient(app)
        
        small_data = {"data": "test" * 100}  # Small payload
        response = client.post("/test", json=small_data)
        assert response.status_code == 200
    
    def test_request_size_limit_blocks_large_request(self, app):
        """Test middleware blocks requests exceeding size limit"""
        app.add_middleware(RequestSizeLimitMiddleware, default_limit=100)  # Very small limit
        client = TestClient(app)
        
        large_data = {"data": "x" * 1000}  # Large payload
        response = client.post("/test", json=large_data)
        # Should return 413 Payload Too Large
        assert response.status_code == 413
    
    def test_request_size_limit_json_limit(self, app):
        """Test middleware enforces JSON-specific limit"""
        app.add_middleware(
            RequestSizeLimitMiddleware,
            default_limit=1024 * 1024,
            json_limit=100  # Small JSON limit
        )
        client = TestClient(app)
        
        large_json = {"data": "x" * 200}
        response = client.post("/test", json=large_json)
        # Should fail due to JSON limit
        assert response.status_code == 413

