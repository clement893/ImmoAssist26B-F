"""Tests for resource endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_resources(client: AsyncClient, auth_headers: dict):
    """Test listing resources."""
    response = await client.get(
        "/api/resources?skip=0&limit=10",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "skip" in data
    assert "limit" in data


@pytest.mark.asyncio
async def test_list_resources_unauthorized(client: AsyncClient):
    """Test listing resources without authentication."""
    response = await client.get("/api/resources")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_resource(client: AsyncClient, auth_headers: dict):
    """Test creating a resource."""
    response = await client.post(
        "/api/resources",
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "created_by" in data


@pytest.mark.asyncio
async def test_get_resource(client: AsyncClient, auth_headers: dict):
    """Test getting a resource by ID."""
    # First create a resource
    create_response = await client.post(
        "/api/resources",
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    resource_id = create_response.json()["id"]
    
    # Get the resource
    response = await client.get(
        f"/api/resources/{resource_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == resource_id


@pytest.mark.asyncio
async def test_update_resource(client: AsyncClient, auth_headers: dict):
    """Test updating a resource."""
    # First create a resource
    create_response = await client.post(
        "/api/resources",
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    resource_id = create_response.json()["id"]
    
    # Update the resource
    response = await client.put(
        f"/api/resources/{resource_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == resource_id
    assert "updated_by" in data


@pytest.mark.asyncio
async def test_delete_resource(client: AsyncClient, auth_headers: dict):
    """Test deleting a resource."""
    # First create a resource
    create_response = await client.post(
        "/api/resources",
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    resource_id = create_response.json()["id"]
    
    # Delete the resource
    response = await client.delete(
        f"/api/resources/{resource_id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

