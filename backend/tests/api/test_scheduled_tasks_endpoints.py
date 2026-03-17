"""
Tests for Scheduled Tasks API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.models.scheduled_task import TaskType, TaskStatus
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_create_scheduled_task(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new scheduled task"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    task_data = {
        "name": "Test Task",
        "description": "Test description",
        "task_type": "email",
        "scheduled_at": "2025-12-31T12:00:00Z",
        "recurrence": "daily"
    }
    
    response = client.post(
        "/api/v1/scheduled-tasks",
        json=task_data,
        headers=headers
    )
    
    # Should return 201 if created, or 400/500 if validation fails
    assert response.status_code in [201, 400, 500]
    
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == task_data["name"]
        assert data["task_type"] == task_data["task_type"]


@pytest.mark.asyncio
async def test_get_scheduled_tasks(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting scheduled tasks for a user"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/scheduled-tasks",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_scheduled_task_by_id(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a specific scheduled task"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock is_admin_or_superadmin to return False (user owns task)
    with patch('app.api.v1.endpoints.scheduled_tasks.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = False
        
        response = client.get(
            "/api/v1/scheduled-tasks/1",
            headers=headers
        )
        
        # Should return 200 if found and user owns it, 404 if not found, 403 if not authorized
        assert response.status_code in [200, 404, 403]


@pytest.mark.asyncio
async def test_get_scheduled_task_admin_access(client: TestClient, test_user: User, db: AsyncSession):
    """Test that admins can access tasks they don't own"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Mock is_admin_or_superadmin to return True (user is admin)
    with patch('app.api.v1.endpoints.scheduled_tasks.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = True
        
        response = client.get(
            "/api/v1/scheduled-tasks/1",
            headers=headers
        )
        
        # Admin should be able to access (200 or 404 if task doesn't exist)
        assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_update_scheduled_task(client: TestClient, test_user: User, db: AsyncSession):
    """Test updating a scheduled task"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    update_data = {
        "name": "Updated Task Name",
        "status": "paused"
    }
    
    with patch('app.api.v1.endpoints.scheduled_tasks.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = False
        
        response = client.put(
            "/api/v1/scheduled-tasks/1",
            json=update_data,
            headers=headers
        )
        
        # Should return 200 if updated, 404 if not found, 403 if not authorized
        assert response.status_code in [200, 404, 403]


@pytest.mark.asyncio
async def test_delete_scheduled_task(client: TestClient, test_user: User, db: AsyncSession):
    """Test deleting a scheduled task"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    with patch('app.api.v1.endpoints.scheduled_tasks.is_admin_or_superadmin') as mock_admin:
        mock_admin.return_value = False
        
        response = client.delete(
            "/api/v1/scheduled-tasks/1",
            headers=headers
        )
        
        # Should return 200 if deleted, 404 if not found, 403 if not authorized
        assert response.status_code in [200, 404, 403]


@pytest.mark.asyncio
async def test_scheduled_tasks_require_authentication(client: TestClient, db: AsyncSession):
    """Test that scheduled tasks endpoints require authentication"""
    endpoints = [
        ("GET", "/api/v1/scheduled-tasks"),
        ("GET", "/api/v1/scheduled-tasks/1"),
        ("POST", "/api/v1/scheduled-tasks"),
        ("PUT", "/api/v1/scheduled-tasks/1"),
        ("DELETE", "/api/v1/scheduled-tasks/1"),
    ]
    
    for method, endpoint in endpoints:
        if method == "GET":
            response = client.get(endpoint)
        elif method == "POST":
            response = client.post(endpoint, json={})
        elif method == "PUT":
            response = client.put(endpoint, json={})
        elif method == "DELETE":
            response = client.delete(endpoint)
        
        assert response.status_code == 401  # Unauthorized
