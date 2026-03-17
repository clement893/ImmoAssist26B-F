"""
Concurrent Request Testing
Tests for handling concurrent requests
"""

import pytest
import asyncio
from httpx import AsyncClient


@pytest.mark.performance
@pytest.mark.slow
class TestConcurrentRequests:
    """Test concurrent request handling"""
    
    @pytest.mark.asyncio
    async def test_concurrent_registrations(
        self,
        client: AsyncClient,
    ):
        """Test concurrent user registrations"""
        async def register_user(index: int):
            return await client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"user{index}@example.com",
                    "password": f"Password{index}!",
                    "first_name": f"User{index}",
                    "last_name": "Test",
                },
            )
        
        # Create 10 concurrent registration requests
        tasks = [register_user(i) for i in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed (or fail gracefully)
        status_codes = [r.status_code for r in responses]
        assert all(code in [201, 400, 429] for code in status_codes)  # Success, validation error, or rate limit
    
    @pytest.mark.asyncio
    async def test_concurrent_logins(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test concurrent login requests"""
        # Register user first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        async def login():
            return await client.post(
                "/api/v1/auth/login",
                data={
                    "username": test_user_data["email"],
                    "password": test_user_data["password"],
                },
            )
        
        # Create 20 concurrent login requests
        tasks = [login() for _ in range(20)]
        responses = await asyncio.gather(*tasks)
        
        # Some may be rate limited, but should handle gracefully
        status_codes = [r.status_code for r in responses]
        assert all(code in [200, 401, 429] for code in status_codes)
    
    @pytest.mark.asyncio
    async def test_concurrent_protected_requests(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test concurrent requests to protected endpoints"""
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
        headers = {"Authorization": f"Bearer {token}"}
        
        async def get_users():
            return await client.get("/api/v1/users/", headers=headers)
        
        # Create 50 concurrent requests
        tasks = [get_users() for _ in range(50)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed (or be rate limited)
        status_codes = [r.status_code for r in responses]
        assert all(code in [200, 429] for code in status_codes)

