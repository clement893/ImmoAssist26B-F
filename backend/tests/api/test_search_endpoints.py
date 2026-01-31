"""
Tests for Search API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_search_users(client: TestClient, test_user: User, db: AsyncSession):
    """Test searching for users"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    search_data = {
        "query": "test",
        "entity_type": "users",
        "limit": 10,
        "offset": 0
    }
    
    response = client.post(
        "/api/v1/search",
        json=search_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "total" in data
    assert "limit" in data
    assert "offset" in data
    assert "has_more" in data
    assert "query" in data
    assert data["query"] == "test"
    assert isinstance(data["results"], list)


@pytest.mark.asyncio
async def test_search_projects(client: TestClient, test_user: User, db: AsyncSession):
    """Test searching for projects"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    search_data = {
        "query": "project",
        "entity_type": "projects",
        "limit": 10,
        "offset": 0
    }
    
    response = client.post(
        "/api/v1/search",
        json=search_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert isinstance(data["results"], list)


@pytest.mark.asyncio
async def test_search_unsupported_entity_type(client: TestClient, test_user: User, db: AsyncSession):
    """Test search with unsupported entity type"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    search_data = {
        "query": "test",
        "entity_type": "unsupported",
        "limit": 10,
        "offset": 0
    }
    
    response = client.post(
        "/api/v1/search",
        json=search_data,
        headers=headers
    )
    
    assert response.status_code == 400
    assert "Unsupported entity type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_search_with_filters(client: TestClient, test_user: User, db: AsyncSession):
    """Test search with additional filters"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    search_data = {
        "query": "test",
        "entity_type": "users",
        "filters": {"is_active": True},
        "limit": 10,
        "offset": 0
    }
    
    response = client.post(
        "/api/v1/search",
        json=search_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "results" in data


@pytest.mark.asyncio
async def test_search_pagination(client: TestClient, test_user: User, db: AsyncSession):
    """Test search pagination"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    search_data = {
        "query": "test",
        "entity_type": "users",
        "limit": 5,
        "offset": 0
    }
    
    response = client.post(
        "/api/v1/search",
        json=search_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 5
    assert data["offset"] == 0


@pytest.mark.asyncio
async def test_search_autocomplete_users(client: TestClient, test_user: User, db: AsyncSession):
    """Test autocomplete for users"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/search/autocomplete?q=test&entity_type=users&limit=10",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert "query" in data
    assert data["query"] == "test"
    assert isinstance(data["suggestions"], list)


@pytest.mark.asyncio
async def test_search_autocomplete_projects(client: TestClient, test_user: User, db: AsyncSession):
    """Test autocomplete for projects"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/search/autocomplete?q=project&entity_type=projects&limit=10",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)


@pytest.mark.asyncio
async def test_search_autocomplete_unsupported_type(client: TestClient, test_user: User, db: AsyncSession):
    """Test autocomplete with unsupported entity type"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/search/autocomplete?q=test&entity_type=unsupported&limit=10",
        headers=headers
    )
    
    assert response.status_code == 400
    assert "Unsupported entity type" in response.json()["detail"]


@pytest.mark.asyncio
async def test_search_autocomplete_min_length(client: TestClient, test_user: User, db: AsyncSession):
    """Test autocomplete with query too short"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/search/autocomplete?q=&entity_type=users&limit=10",
        headers=headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_search_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that search requires authentication"""
    search_data = {
        "query": "test",
        "entity_type": "users",
        "limit": 10,
        "offset": 0
    }
    
    response = client.post(
        "/api/v1/search",
        json=search_data
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_search_autocomplete_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that autocomplete requires authentication"""
    response = client.get(
        "/api/v1/search/autocomplete?q=test&entity_type=users&limit=10"
    )
    
    assert response.status_code == 401

