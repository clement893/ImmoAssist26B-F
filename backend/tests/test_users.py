"""
User Management API Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_users(client: AsyncClient, test_user: dict) -> None:
    """Test getting list of users"""
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.asyncio
async def test_get_user_by_id(client: AsyncClient, test_user: dict) -> None:
    """Test getting user by ID"""
    response = await client.get(f"/api/v1/users/{test_user['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user["id"]
    assert data["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient) -> None:
    """Test getting non-existent user"""
    response = await client.get("/api/v1/users/99999")
    assert response.status_code == 404
