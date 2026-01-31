"""
API endpoint tests for API key management
"""

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.auth import create_access_token


@pytest.mark.api
@pytest.mark.asyncio
class TestAPIKeyEndpoints:
    """Test API key management endpoints"""
    
    async def test_generate_api_key(
        self,
        client: TestClient,
        authenticated_user: User,
    ):
        """Test generating an API key"""
        token = authenticated_user.access_token
        
        response = client.post(
            "/api/v1/api-keys/generate",
            json={
                "name": "Test API Key",
                "description": "Test description",
                "rotation_policy": "90d",
                "expires_in_days": 365,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "key" in data
        assert data["name"] == "Test API Key"
        assert data["rotation_policy"] == "90d"
        assert "key_prefix" in data
    
    async def test_generate_api_key_invalid_policy(
        self,
        client: TestClient,
        authenticated_user: User,
    ):
        """Test generating API key with invalid rotation policy"""
        token = authenticated_user.access_token
        
        response = client.post(
            "/api/v1/api-keys/generate",
            json={
                "name": "Test Key",
                "rotation_policy": "invalid",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    async def test_list_api_keys(
        self,
        client: TestClient,
        authenticated_user: User,
        db: AsyncSession,
    ):
        """Test listing API keys"""
        from app.services.api_key_service import APIKeyService
        
        # Create some API keys
        await APIKeyService.create_api_key(
            db=db,
            user=authenticated_user,
            name="Key 1",
        )
        await APIKeyService.create_api_key(
            db=db,
            user=authenticated_user,
            name="Key 2",
        )
        
        token = authenticated_user.access_token
        
        response = client.get(
            "/api/v1/api-keys/list",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
    
    async def test_rotate_api_key(
        self,
        client: TestClient,
        authenticated_user: User,
        db: AsyncSession,
    ):
        """Test rotating an API key"""
        from app.services.api_key_service import APIKeyService
        
        # Create API key
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=authenticated_user,
            name="Key to Rotate",
        )
        
        token = authenticated_user.access_token
        
        response = client.post(
            f"/api/v1/api-keys/{api_key.id}/rotate",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "new_key" in data
        assert data["old_key_id"] == api_key.id
        assert "key" in data["new_key"]
    
    async def test_revoke_api_key(
        self,
        client: TestClient,
        authenticated_user: User,
        db: AsyncSession,
    ):
        """Test revoking an API key"""
        from app.services.api_key_service import APIKeyService
        
        # Create API key
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=authenticated_user,
            name="Key to Revoke",
        )
        
        token = authenticated_user.access_token
        
        response = client.delete(
            f"/api/v1/api-keys/{api_key.id}",
            headers={"Authorization": f"Bearer {token}"},
            params={"reason": "Test revocation"},
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        
        # Verify key is revoked
        await db.refresh(api_key)
        assert api_key.is_active is False
    
    async def test_unauthorized_access(
        self,
        client: TestClient,
    ):
        """Test unauthorized access to API key endpoints"""
        response = client.post(
            "/api/v1/api-keys/generate",
            json={"name": "Test Key"},
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

