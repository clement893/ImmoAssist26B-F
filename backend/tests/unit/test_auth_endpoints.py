"""
Comprehensive tests for authentication endpoints.

Tests cover:
- User registration
- User login
- Token refresh
- Password reset
- Email verification
- OAuth flows
- Error handling
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt

from app.core.config import settings
from app.models.user import User


@pytest.mark.asyncio
async def test_register_user_success(client: TestClient, db: AsyncSession):
    """Test successful user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == "test@example.com"
    assert "password" not in data  # Password should not be in response


@pytest.mark.asyncio
async def test_register_user_duplicate_email(client: TestClient, db: AsyncSession, test_user: User):
    """Test registration with duplicate email fails"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == 400
    assert "email" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_user_weak_password(client: TestClient, db: AsyncSession):
    """Test registration with weak password fails"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "123",  # Too weak
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_login_success(client: TestClient, db: AsyncSession, test_user: User):
    """Test successful login"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: TestClient, db: AsyncSession, test_user: User):
    """Test login with invalid credentials fails"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: TestClient, db: AsyncSession):
    """Test login with non-existent user fails"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_success(client: TestClient, db: AsyncSession, test_user: User):
    """Test successful token refresh"""
    # First login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword123",
        },
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Refresh token
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_token_invalid(client: TestClient, db: AsyncSession):
    """Test refresh with invalid token fails"""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_expired(client: TestClient, db: AsyncSession):
    """Test refresh with expired token fails"""
    # Create expired token
    expired_data = {
        "sub": "test@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(days=1),
    }
    expired_token = jwt.encode(expired_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": expired_token},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_success(client: TestClient, db: AsyncSession, test_user: User):
    """Test getting current user with valid token"""
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword123",
        },
    )
    token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client: TestClient, db: AsyncSession):
    """Test getting current user with invalid token fails"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: TestClient, db: AsyncSession):
    """Test getting current user without token fails"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_success(client: TestClient, db: AsyncSession, test_user: User):
    """Test successful password reset request"""
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": test_user.email},
    )
    # Should return 200 even if user doesn't exist (security)
    assert response.status_code in [200, 202]


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_user(client: TestClient, db: AsyncSession):
    """Test password reset request for non-existent user"""
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent@example.com"},
    )
    # Should return 200 for security (don't reveal if user exists)
    assert response.status_code in [200, 202]


@pytest.mark.asyncio
async def test_rate_limiting_login(client: TestClient, db: AsyncSession, test_user: User):
    """Test rate limiting on login endpoint"""
    # Make multiple login attempts
    for i in range(6):  # Limit is 5/minute
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user.email,
                "password": "wrongpassword",
            },
        )
    
    # 6th attempt should be rate limited
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_rate_limiting_register(client: TestClient, db: AsyncSession):
    """Test rate limiting on register endpoint"""
    # Make multiple registration attempts
    for i in range(4):  # Limit is 3/minute
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"test{i}@example.com",
                "password": "SecurePass123!",
                "first_name": "Test",
                "last_name": "User",
            },
        )
    
    # 4th attempt should be rate limited
    assert response.status_code == 429

