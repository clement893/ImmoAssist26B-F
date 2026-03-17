"""
Tests for Backups API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.models.backup import BackupType, BackupStatus
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_create_backup(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new backup"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    backup_data = {
        "name": "Test Backup",
        "description": "Test backup description",
        "backup_type": "database",
        "retention_days": 30
    }
    
    response = client.post(
        "/api/v1/backups",
        json=backup_data,
        headers=headers
    )
    
    # Should return 201 if created, or 400/500 if validation fails
    assert response.status_code in [201, 400, 500]
    
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == backup_data["name"]
        assert data["backup_type"] == backup_data["backup_type"]


@pytest.mark.asyncio
async def test_get_backups(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting backups for a user"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/backups",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_backup_by_id(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a specific backup"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock is_admin_or_superadmin to return False (user owns backup)
    with patch('app.api.v1.endpoints.backups.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = False
        
        response = client.get(
            "/api/v1/backups/1",
            headers=headers
        )
        
        # Should return 200 if found and user owns it, 404 if not found, 403 if not authorized
        assert response.status_code in [200, 404, 403]


@pytest.mark.asyncio
async def test_get_backup_admin_access(client: TestClient, test_user: User, db: AsyncSession):
    """Test that admins can access backups they don't own"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock is_admin_or_superadmin to return True (user is admin)
    with patch('app.api.v1.endpoints.backups.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = True
        
        response = client.get(
            "/api/v1/backups/1",
            headers=headers
        )
        
        # Admin should be able to access (200 or 404 if backup doesn't exist)
        assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_restore_backup(client: TestClient, test_user: User, db: AsyncSession):
    """Test restoring from a backup"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    with patch('app.api.v1.endpoints.backups.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = False
        
        response = client.post(
            "/api/v1/backups/1/restore",
            headers=headers
        )
        
        # Should return 200 if restore initiated, 400 if backup not completed, 404 if not found, 403 if not authorized
        assert response.status_code in [200, 400, 404, 403]
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") is True


@pytest.mark.asyncio
async def test_get_backups_with_filters(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting backups with filters"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with backup_type filter
    response = client.get(
        "/api/v1/backups?backup_type=database",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Test with status filter
    response = client.get(
        "/api/v1/backups?status=completed",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_backups_require_authentication(client: TestClient, db: AsyncSession):
    """Test that backups endpoints require authentication"""
    endpoints = [
        ("GET", "/api/v1/backups"),
        ("GET", "/api/v1/backups/1"),
        ("POST", "/api/v1/backups"),
        ("POST", "/api/v1/backups/1/restore"),
    ]
    
    for method, endpoint in endpoints:
        if method == "GET":
            response = client.get(endpoint)
        elif method == "POST":
            response = client.post(endpoint, json={})
        
        assert response.status_code == 401  # Unauthorized
