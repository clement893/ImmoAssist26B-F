"""
Tests for CSRF Protection Middleware
"""

import pytest
from unittest.mock import AsyncMock, Mock
from fastapi import Request, FastAPI
from fastapi.testclient import TestClient
from starlette.responses import JSONResponse

from app.core.csrf import CSRFMiddleware, generate_csrf_token, validate_csrf_token


class TestCSRFMiddleware:
    """Tests for CSRFMiddleware"""
    
    @pytest.fixture
    def app(self):
        """Create test FastAPI app"""
        app = FastAPI()
        
        @app.post("/test")
        async def test_endpoint():
            return {"status": "ok"}
        
        return app
    
    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)
    
    def test_generate_csrf_token(self):
        """Test CSRF token generation"""
        token = generate_csrf_token()
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_validate_csrf_token_match(self):
        """Test CSRF token validation with matching tokens"""
        token = generate_csrf_token()
        assert validate_csrf_token(token, token) is True
    
    def test_validate_csrf_token_mismatch(self):
        """Test CSRF token validation with mismatched tokens"""
        token1 = generate_csrf_token()
        token2 = generate_csrf_token()
        assert validate_csrf_token(token1, token2) is False
    
    def test_validate_csrf_token_missing(self):
        """Test CSRF token validation with missing tokens"""
        assert validate_csrf_token(None, "token") is False
        assert validate_csrf_token("token", None) is False
        assert validate_csrf_token(None, None) is False
    
    def test_csrf_middleware_safe_methods(self, app):
        """Test CSRF middleware allows safe methods"""
        app.add_middleware(CSRFMiddleware, secret_key="test_secret")
        client = TestClient(app)
        
        # GET request should work and set CSRF cookie
        response = client.get("/test")
        assert response.status_code == 200
        assert "csrf_token" in response.cookies
    
    def test_csrf_middleware_unsafe_methods_without_token(self, app):
        """Test CSRF middleware blocks unsafe methods without token"""
        app.add_middleware(CSRFMiddleware, secret_key="test_secret")
        client = TestClient(app)
        
        # POST without CSRF token should fail
        response = client.post("/test")
        assert response.status_code == 403
    
    def test_csrf_middleware_unsafe_methods_with_token(self, app):
        """Test CSRF middleware allows unsafe methods with valid token"""
        app.add_middleware(CSRFMiddleware, secret_key="test_secret")
        client = TestClient(app)
        
        # First, get CSRF token
        get_response = client.get("/test")
        csrf_token = get_response.cookies.get("csrf_token")
        
        # POST with CSRF token should succeed
        response = client.post(
            "/test",
            headers={"X-CSRF-Token": csrf_token},
            cookies={"csrf_token": csrf_token}
        )
        assert response.status_code == 200
    
    def test_csrf_middleware_token_mismatch(self, app):
        """Test CSRF middleware blocks requests with mismatched tokens"""
        app.add_middleware(CSRFMiddleware, secret_key="test_secret")
        client = TestClient(app)
        
        # Get CSRF token
        get_response = client.get("/test")
        csrf_token = get_response.cookies.get("csrf_token")
        
        # POST with mismatched token should fail
        response = client.post(
            "/test",
            headers={"X-CSRF-Token": "wrong_token"},
            cookies={"csrf_token": csrf_token}
        )
        assert response.status_code == 403
    
    def test_csrf_middleware_options_method(self, app):
        """Test CSRF middleware allows OPTIONS method"""
        app.add_middleware(CSRFMiddleware, secret_key="test_secret")
        client = TestClient(app)
        
        response = client.options("/test")
        # OPTIONS should be allowed (safe method)
        assert response.status_code in [200, 405]  # 405 if endpoint doesn't support OPTIONS

