"""
Integration tests for authentication flow
"""

import pytest
from httpx import AsyncClient
from app.models.user import User


@pytest.mark.integration
class TestAuthFlow:
    """Test complete authentication flow"""
    
    @pytest.mark.asyncio
    async def test_register_and_login(self, client: AsyncClient, test_user_data: dict):
        """Test user registration and login flow"""
        # Register user
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        
        assert register_response.status_code == 201
        user_data = register_response.json()
        assert user_data["email"] == test_user_data["email"]
        
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        
        assert login_response.status_code == 200
        token_data = login_response.json()
        assert "access_token" in token_data
        assert "refresh_token" in token_data
    
    @pytest.mark.asyncio
    async def test_protected_endpoint_with_token(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        db_session
    ):
        """Test accessing protected endpoint with token"""
        # Register and login
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        token = login_response.json()["access_token"]
        
        # Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/api/v1/users/me", headers=headers)
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_refresh_token_flow(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test token refresh flow"""
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
        
        # Refresh token
        refresh_response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        
        assert refresh_response.status_code == 200
        new_token_data = refresh_response.json()
        assert "access_token" in new_token_data

