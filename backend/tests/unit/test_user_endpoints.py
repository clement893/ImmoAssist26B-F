"""
Comprehensive tests for user management endpoints.

Tests cover:
- Get user profile
- Update user profile
- Delete user
- List users (admin)
- User permissions
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


@pytest.mark.asyncio
async def test_get_user_profile(client: TestClient, db: AsyncSession, authenticated_user: User):
    """Test getting user profile"""
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == authenticated_user.email
    assert "password" not in data


@pytest.mark.asyncio
async def test_update_user_profile(client: TestClient, db: AsyncSession, authenticated_user: User):
    """Test updating user profile"""
    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
        json={
            "first_name": "Updated",
            "last_name": "Name",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "Name"


@pytest.mark.asyncio
async def test_update_user_email(client: TestClient, db: AsyncSession, authenticated_user: User):
    """Test updating user email"""
    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
        json={
            "email": "newemail@example.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newemail@example.com"


@pytest.mark.asyncio
async def test_update_user_duplicate_email(client: TestClient, db: AsyncSession, authenticated_user: User, test_user: User):
    """Test updating to duplicate email fails"""
    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
        json={
            "email": test_user.email,
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_user(client: TestClient, db: AsyncSession, authenticated_user: User):
    """Test deleting user account"""
    response = client.delete(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_list_users_admin(client: TestClient, db: AsyncSession, admin_user: User):
    """Test admin can list all users"""
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_user.access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


@pytest.mark.asyncio
async def test_list_users_non_admin(client: TestClient, db: AsyncSession, authenticated_user: User):
    """Test non-admin cannot list all users"""
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_user_by_id_admin(client: TestClient, db: AsyncSession, admin_user: User, test_user: User):
    """Test admin can get user by ID"""
    response = client.get(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_user.access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_get_user_by_id_self(client: TestClient, db: AsyncSession, authenticated_user: User):
    """Test user can get their own profile by ID"""
    response = client.get(
        f"/api/v1/users/{authenticated_user.id}",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_user_by_id_unauthorized(client: TestClient, db: AsyncSession, authenticated_user: User, test_user: User):
    """Test user cannot get another user's profile"""
    response = client.get(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {authenticated_user.access_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_user_by_id_admin(client: TestClient, db: AsyncSession, admin_user: User, test_user: User):
    """Test admin can update user by ID"""
    response = client.put(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_user.access_token}"},
        json={
            "first_name": "Admin Updated",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Admin Updated"


@pytest.mark.asyncio
async def test_delete_user_by_id_admin(client: TestClient, db: AsyncSession, admin_user: User, test_user: User):
    """Test admin can delete user by ID"""
    response = client.delete(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {admin_user.access_token}"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_pagination_users(client: TestClient, db: AsyncSession, admin_user: User):
    """Test pagination for user list"""
    response = client.get(
        "/api/v1/users?skip=0&limit=10",
        headers={"Authorization": f"Bearer {admin_user.access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 10


@pytest.mark.asyncio
async def test_search_users(client: TestClient, db: AsyncSession, admin_user: User):
    """Test searching users"""
    response = client.get(
        "/api/v1/users?search=test",
        headers={"Authorization": f"Bearer {admin_user.access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

