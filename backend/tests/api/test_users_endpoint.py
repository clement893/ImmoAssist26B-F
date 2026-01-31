"""
API endpoint tests for users
"""

import pytest
from httpx import AsyncClient


@pytest.mark.api
class TestUsersEndpoint:
    """Test users API endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_users_pagination(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        # Get token first
        await client.post("/api/v1/auth/register", json=test_user_data)
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        token = login_response.json()["access_token"]
        """Test listing users with pagination"""
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.get(
            "/api/v1/users/?page=1&page_size=10",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert "has_next" in data
        assert "has_previous" in data
    
    @pytest.mark.asyncio
    async def test_list_users_filter_active(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test filtering users by active status"""
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
        
        response = await client.get(
            "/api/v1/users/?is_active=true",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_list_users_search(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test searching users"""
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
        
        response = await client.get(
            "/api/v1/users/?search=test",
            headers=headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["items"], list)
    
    @pytest.mark.asyncio
    async def test_get_user_by_id(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test getting user by ID"""
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
        
        # Try to get a user (may not exist, so check status)
        response = await client.get(
            "/api/v1/users/1",
            headers=headers,
        )
        
        # Should either return 200 or 404
        assert response.status_code in [200, 404]
    
    @pytest.mark.asyncio
    async def test_get_user_not_found(
        self,
        client: AsyncClient,
        test_user_data: dict,
    ):
        """Test getting non-existent user"""
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
        
        response = await client.get(
            "/api/v1/users/99999",
            headers=headers,
        )
        
        assert response.status_code == 404

