"""Tests for organization endpoints."""

import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.models.user import User
from app.models.organization import Organization


@pytest.mark.asyncio
async def test_create_organization(client: AsyncClient, auth_headers: dict):
    """Test creating an organization."""
    response = await client.post(
        "/api/organizations",
        json={
            "name": "New Organization",
            "slug": "new-org",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Organization"
    assert data["slug"] == "new-org"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_organization_duplicate_slug(
    client: AsyncClient, 
    auth_headers: dict,
    test_organization: Organization
):
    """Test creating organization with duplicate slug."""
    response = await client.post(
        "/api/organizations",
        json={
            "name": "Duplicate Org",
            "slug": test_organization.slug,  # Use existing slug
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_organizations(client: AsyncClient, auth_headers: dict, test_organization: Organization):
    """Test listing organizations."""
    response = await client.get("/api/organizations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # At least our test organization


@pytest.mark.asyncio
async def test_list_organizations_pagination(client: AsyncClient, auth_headers: dict):
    """Test organization list pagination."""
    response = await client.get("/api/organizations?skip=0&limit=1", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_organization(
    client: AsyncClient, 
    auth_headers: dict, 
    test_organization: Organization
):
    """Test getting organization by ID."""
    response = await client.get(
        f"/api/organizations/{test_organization.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_organization.id)
    assert data["name"] == test_organization.name


@pytest.mark.asyncio
async def test_get_organization_not_found(client: AsyncClient, auth_headers: dict):
    """Test getting non-existent organization."""
    fake_id = uuid4()
    response = await client.get(
        f"/api/organizations/{fake_id}",
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_organization(
    client: AsyncClient,
    auth_headers: dict,
    test_organization: Organization
):
    """Test updating organization."""
    response = await client.put(
        f"/api/organizations/{test_organization.id}",
        json={
            "name": "Updated Organization Name",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Organization Name"


@pytest.mark.asyncio
async def test_update_organization_unauthorized(
    client: AsyncClient,
    auth_headers_user2: dict,
    test_organization: Organization
):
    """Test updating organization without permission."""
    response = await client.put(
        f"/api/organizations/{test_organization.id}",
        json={
            "name": "Unauthorized Update",
        },
        headers=auth_headers_user2,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_organization(
    client: AsyncClient,
    auth_headers: dict,
    test_organization: Organization
):
    """Test deleting organization."""
    response = await client.delete(
        f"/api/organizations/{test_organization.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_add_member(
    client: AsyncClient,
    auth_headers: dict,
    test_organization: Organization,
    test_user2: User
):
    """Test adding member to organization."""
    response = await client.post(
        f"/api/organizations/{test_organization.id}/members",
        json={
            "user_id": str(test_user2.id),
            "role": "member",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == str(test_user2.id)
    assert data["role"] == "member"


@pytest.mark.asyncio
async def test_list_members(
    client: AsyncClient,
    auth_headers: dict,
    test_organization: Organization
):
    """Test listing organization members."""
    response = await client.get(
        f"/api/organizations/{test_organization.id}/members",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # At least the owner


@pytest.mark.asyncio
async def test_update_member(
    client: AsyncClient,
    auth_headers: dict,
    test_organization: Organization,
    test_user2: User
):
    """Test updating organization member."""
    # First add member
    add_response = await client.post(
        f"/api/organizations/{test_organization.id}/members",
        json={
            "user_id": str(test_user2.id),
            "role": "member",
        },
        headers=auth_headers,
    )
    assert add_response.status_code == 201
    member_id = add_response.json()["id"]
    
    # Update member
    response = await client.put(
        f"/api/organizations/{test_organization.id}/members/{member_id}",
        json={
            "role": "admin",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_remove_member(
    client: AsyncClient,
    auth_headers: dict,
    test_organization: Organization,
    test_user2: User
):
    """Test removing member from organization."""
    # First add member
    add_response = await client.post(
        f"/api/organizations/{test_organization.id}/members",
        json={
            "user_id": str(test_user2.id),
            "role": "member",
        },
        headers=auth_headers,
    )
    assert add_response.status_code == 201
    member_id = add_response.json()["id"]
    
    # Remove member
    response = await client.delete(
        f"/api/organizations/{test_organization.id}/members/{member_id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

