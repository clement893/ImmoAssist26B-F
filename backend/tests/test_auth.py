"""
Authentication API Tests
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient) -> None:
    """Test user registration"""
    user_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123",
        "first_name": "New",
        "last_name": "User",
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["first_name"] == user_data["first_name"]
    assert data["last_name"] == user_data["last_name"]
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user: dict) -> None:
    """Test registration with duplicate email"""
    user_data = {
        "email": test_user["email"],
        "password": "AnotherPassword123",
        "first_name": "Another",
        "last_name": "User",
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient) -> None:
    """Test registration with weak password"""
    user_data = {
        "email": "weak@example.com",
        "password": "weak",
        "first_name": "Weak",
        "last_name": "User",
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: dict) -> None:
    """Test successful login"""
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"],
    }
    response = await client.post(
        "/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient) -> None:
    """Test login with invalid credentials"""
    login_data = {
        "username": "nonexistent@example.com",
        "password": "WrongPassword123",
    }
    response = await client.post(
        "/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, test_user: dict) -> None:
    """Test getting current user info"""
    # First login to get token
    login_data = {
        "username": test_user["email"],
        "password": test_user["password"],
    }
    login_response = await client.post(
        "/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient) -> None:
    """Test getting current user without token"""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
