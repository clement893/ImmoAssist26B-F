"""
Tests for Onboarding API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_get_onboarding_steps(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting onboarding steps for a user"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock RBACService to return user roles
    with patch('app.api.v1.endpoints.onboarding.RBACService') as mock_rbac:
        mock_rbac_instance = AsyncMock()
        mock_rbac.return_value = mock_rbac_instance
        
        # Mock get_user_roles to return empty list (no roles)
        mock_rbac_instance.get_user_roles = AsyncMock(return_value=[])
        
        response = client.get(
            "/api/v1/onboarding/steps",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_onboarding_progress(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting onboarding progress"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/onboarding/progress",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "completed_steps" in data or "progress" in data or "total_steps" in data


@pytest.mark.asyncio
async def test_get_next_step(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting next onboarding step"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/onboarding/next-step",
        headers=headers
    )
    
    # Should return 200 with step or null
    assert response.status_code == 200
    data = response.json()
    # Can be null or a step object
    assert data is None or isinstance(data, dict)


@pytest.mark.asyncio
async def test_initialize_onboarding(client: TestClient, test_user: User, db: AsyncSession):
    """Test initializing onboarding for a user"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock RBACService
    with patch('app.api.v1.endpoints.onboarding.RBACService') as mock_rbac:
        mock_rbac_instance = AsyncMock()
        mock_rbac.return_value = mock_rbac_instance
        mock_rbac_instance.get_user_roles = AsyncMock(return_value=[])
        
        response = client.post(
            "/api/v1/onboarding/initialize",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "message" in data


@pytest.mark.asyncio
async def test_complete_step(client: TestClient, test_user: User, db: AsyncSession):
    """Test completing an onboarding step"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # First initialize onboarding
    with patch('app.api.v1.endpoints.onboarding.RBACService') as mock_rbac:
        mock_rbac_instance = AsyncMock()
        mock_rbac.return_value = mock_rbac_instance
        mock_rbac_instance.get_user_roles = AsyncMock(return_value=[])
        
        # Initialize
        client.post("/api/v1/onboarding/initialize", headers=headers)
        
        # Try to complete a step (use a common step key)
        response = client.post(
            "/api/v1/onboarding/steps/profile/complete",
            headers=headers
        )
        
        # Should return 200 or 404 if step doesn't exist
        assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_onboarding_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that onboarding endpoints require authentication"""
    endpoints = [
        "/api/v1/onboarding/steps",
        "/api/v1/onboarding/progress",
        "/api/v1/onboarding/next-step",
        "/api/v1/onboarding/initialize",
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint) if endpoint != "/api/v1/onboarding/initialize" else client.post(endpoint)
        assert response.status_code == 401  # Unauthorized
