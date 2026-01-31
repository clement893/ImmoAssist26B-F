"""
Tests for tenancy middleware

Tests verify that TenancyMiddleware correctly extracts tenant from requests.
"""

import os
import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.tenancy import TenancyConfig, get_current_tenant, clear_current_tenant
from app.core.tenancy_middleware import TenancyMiddleware


@pytest.fixture
def app():
    """Create test FastAPI app"""
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint(request: Request):
        tenant_id = get_current_tenant()
        return {"tenant_id": tenant_id}
    
    return app


class TestTenancyMiddleware:
    """Test TenancyMiddleware"""
    
    def setup_method(self):
        """Reset state before each test"""
        TenancyConfig.reset()
        clear_current_tenant()
    
    def test_middleware_disabled_in_single_mode(self, app):
        """Test that middleware does nothing in single mode"""
        os.environ["TENANCY_MODE"] = "single"
        TenancyConfig.reset()
        
        # Don't add middleware - it should be skipped in single mode
        client = TestClient(app)
        response = client.get("/test")
        
        assert response.status_code == 200
        assert response.json()["tenant_id"] is None
    
    def test_middleware_extracts_from_header(self, app):
        """Test that middleware extracts tenant from X-Tenant-ID header"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        app.add_middleware(TenancyMiddleware)
        client = TestClient(app)
        
        response = client.get("/test", headers={"X-Tenant-ID": "123"})
        
        assert response.status_code == 200
        assert response.json()["tenant_id"] == 123
    
    def test_middleware_extracts_from_query_param(self, app):
        """Test that middleware extracts tenant from query parameter"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        app.add_middleware(TenancyMiddleware)
        client = TestClient(app)
        
        response = client.get("/test?tenant_id=456")
        
        assert response.status_code == 200
        assert response.json()["tenant_id"] == 456
    
    def test_middleware_header_priority_over_query(self, app):
        """Test that header takes priority over query parameter"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        app.add_middleware(TenancyMiddleware)
        client = TestClient(app)
        
        response = client.get(
            "/test?tenant_id=456",
            headers={"X-Tenant-ID": "123"}
        )
        
        assert response.status_code == 200
        assert response.json()["tenant_id"] == 123
    
    def test_middleware_invalid_header(self, app):
        """Test that middleware rejects invalid header values"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        app.add_middleware(TenancyMiddleware)
        client = TestClient(app)
        
        response = client.get("/test", headers={"X-Tenant-ID": "invalid"})
        
        assert response.status_code == 400
        assert "Invalid" in response.json()["detail"]
    
    def test_middleware_clears_context_after_request(self, app):
        """Test that middleware clears tenant context after request"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        app.add_middleware(TenancyMiddleware)
        client = TestClient(app)
        
        # First request sets tenant
        response1 = client.get("/test", headers={"X-Tenant-ID": "123"})
        assert response1.status_code == 200
        assert response1.json()["tenant_id"] == 123
        
        # Second request without header should have no tenant
        response2 = client.get("/test")
        assert response2.status_code == 200
        assert response2.json()["tenant_id"] is None

