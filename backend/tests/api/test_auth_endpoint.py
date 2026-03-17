"""
API endpoint tests for authentication
"""

import pytest
from httpx import AsyncClient


@pytest.mark.api
class TestAuthEndpoint:
    """Test authentication API endpoints"""
    
    @pytest.mark.asyncio
    async def test_register_user(self, client: AsyncClient, test_user_data: dict):
        """Test user registration"""
        response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test registering with duplicate email"""
        # Register first time
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try to register again
        response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_login_success(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test successful login"""
        # Register first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test login with invalid credentials"""
        # Register first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Try to login with wrong password
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": "wrong_password",
            },
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_refresh_token(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test token refresh"""
        # Register and login
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

