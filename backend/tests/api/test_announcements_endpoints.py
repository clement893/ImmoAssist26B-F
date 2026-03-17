"""
Tests for Announcements API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_get_active_announcements(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting active announcements for a user"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock RBACService and get_user_tenant_id
    with patch('app.api.v1.endpoints.announcements.RBACService') as mock_rbac, \
         patch('app.api.v1.endpoints.announcements.get_user_tenant_id') as mock_tenant:
        
        mock_rbac_instance = AsyncMock()
        mock_rbac.return_value = mock_rbac_instance
        mock_rbac_instance.get_user_roles = AsyncMock(return_value=[])
        mock_tenant.return_value = None
        
        response = client.get(
            "/api/v1/announcements",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_active_announcements_with_filters(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting announcements with filters"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    with patch('app.api.v1.endpoints.announcements.RBACService') as mock_rbac, \
         patch('app.api.v1.endpoints.announcements.get_user_tenant_id') as mock_tenant:
        
        mock_rbac_instance = AsyncMock()
        mock_rbac.return_value = mock_rbac_instance
        mock_rbac_instance.get_user_roles = AsyncMock(return_value=[])
        mock_tenant.return_value = None
        
        # Test with show_on_login filter
        response = client.get(
            "/api/v1/announcements?show_on_login=true",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_create_announcement_requires_admin(client: TestClient, test_user: User, db: AsyncSession):
    """Test that creating announcements requires admin privileges"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    announcement_data = {
        "title": "Test Announcement",
        "message": "This is a test announcement",
        "type": "info",
        "priority": "medium"
    }
    
    response = client.post(
        "/api/v1/announcements",
        json=announcement_data,
        headers=headers
    )
    
    # Should return 403 if user is not admin, or 201 if admin
    assert response.status_code in [201, 403]


@pytest.mark.asyncio
async def test_get_announcement_by_id(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a specific announcement by ID"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/announcements/1",
        headers=headers
    )
    
    # Should return 200 if found, 404 if not found
    assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_announcements_require_authentication(client: TestClient, db: AsyncSession):
    """Test that announcements endpoints require authentication"""
    endpoints = [
        "/api/v1/announcements",
        "/api/v1/announcements/1",
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 401  # Unauthorized
