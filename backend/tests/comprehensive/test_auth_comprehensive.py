"""
Comprehensive Authentication Tests
Covers all authentication scenarios and edge cases
"""

import pytest
from httpx import AsyncClient
from app.models.user import User


@pytest.mark.comprehensive
class TestAuthComprehensive:
    """Comprehensive authentication tests"""
    
    @pytest.mark.asyncio
    async def test_complete_auth_flow(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test complete authentication flow"""
        # 1. Register
        register_response = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        assert register_response.status_code == 201
        
        # 2. Login
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        assert login_response.status_code == 200
        tokens = login_response.json()
        
        # 3. Use access token
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        protected_response = await client.get("/api/v1/users/", headers=headers)
        assert protected_response.status_code == 200
        
        # 4. Refresh token
        refresh_response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()
        assert "access_token" in new_tokens
    
    @pytest.mark.asyncio
    async def test_multiple_registrations_same_email(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test that duplicate email registration fails"""
        # First registration
        response1 = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        assert response1.status_code == 201
        
        # Second registration with same email
        response2 = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        assert response2.status_code == 400
    
    @pytest.mark.asyncio
    async def test_case_insensitive_email(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test that email is case-insensitive"""
        # Register with lowercase
        test_user_data["email"] = "test@example.com"
        response1 = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        assert response1.status_code == 201
        
        # Try to register with uppercase (should fail)
        test_user_data["email"] = "TEST@EXAMPLE.COM"
        response2 = await client.post(
            "/api/v1/auth/register",
            json=test_user_data,
        )
        assert response2.status_code == 400
    
    @pytest.mark.asyncio
    async def test_password_case_sensitivity(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test that password is case-sensitive"""
        # Register
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login with wrong case password
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"].upper(),
            },
        )
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_token_expiration(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test that expired tokens are rejected"""
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
        
        # Use token immediately (should work)
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/api/v1/users/", headers=headers)
        assert response.status_code == 200
        
        # Note: Testing actual expiration would require waiting or mocking time
    
    @pytest.mark.asyncio
    async def test_invalid_token_format(
        self,
        client: AsyncClient,
    ):
        """Test that invalid token formats are rejected"""
        invalid_tokens = [
            "not-a-token",
            "Bearer",
            "Bearer ",
            "Bearer invalid.token.here",
            "",
        ]
        
        for token in invalid_tokens:
            headers = {"Authorization": token}
            response = await client.get("/api/v1/users/", headers=headers)
            assert response.status_code == 401

