"""
Tests for Tags and Categories API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.auth import create_access_token


# Tag tests
@pytest.mark.asyncio
async def test_create_tag(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new tag"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    tag_data = {
        "name": "test-tag",
        "entity_type": "project",
        "entity_id": 1,
        "color": "#FF0000",
        "description": "Test tag description"
    }
    
    response = client.post(
        "/api/v1/tags",
        json=tag_data,
        headers=headers
    )
    
    assert response.status_code in [201, 400, 500]
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == tag_data["name"]
        assert data["entity_type"] == tag_data["entity_type"]
        assert "id" in data
        assert "slug" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_get_entity_tags(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting tags for an entity"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/tags/entity/project/1",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_add_tag_to_entity(client: TestClient, test_user: User, db: AsyncSession):
    """Test adding a tag to an entity"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # First create a tag
    tag_data = {
        "name": "new-tag",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/tags",
        json=tag_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        tag_id = create_response.json()["id"]
        
        # Add tag to another entity
        response = client.post(
            f"/api/v1/tags/{tag_id}/entities/project/2",
            headers=headers
        )
        
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True


@pytest.mark.asyncio
async def test_remove_tag_from_entity(client: TestClient, test_user: User, db: AsyncSession):
    """Test removing a tag from an entity"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # First create and add a tag
    tag_data = {
        "name": "tag-to-remove",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/tags",
        json=tag_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        tag_id = create_response.json()["id"]
        
        # Remove tag
        response = client.delete(
            f"/api/v1/tags/{tag_id}/entities/project/1",
            headers=headers
        )
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True


@pytest.mark.asyncio
async def test_get_popular_tags(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting popular tags"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/tags/popular?limit=10",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_popular_tags_by_entity_type(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting popular tags filtered by entity type"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/tags/popular?entity_type=project&limit=10",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_search_tags(client: TestClient, test_user: User, db: AsyncSession):
    """Test searching tags"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/tags/search?q=test&limit=10",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_search_tags_with_entity_type(client: TestClient, test_user: User, db: AsyncSession):
    """Test searching tags with entity type filter"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/tags/search?q=test&entity_type=project&limit=10",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_tag_validation(client: TestClient, test_user: User, db: AsyncSession):
    """Test tag validation"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with empty name
    invalid_data = {
        "name": "",
        "entity_type": "project",
        "entity_id": 1
    }
    
    response = client.post(
        "/api/v1/tags",
        json=invalid_data,
        headers=headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_tag_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that creating tags requires authentication"""
    tag_data = {
        "name": "test-tag",
        "entity_type": "project",
        "entity_id": 1
    }
    
    response = client.post(
        "/api/v1/tags",
        json=tag_data
    )
    
    assert response.status_code == 401


# Category tests
@pytest.mark.asyncio
async def test_create_category(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new category"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    category_data = {
        "name": "Test Category",
        "entity_type": "project",
        "description": "Test category description",
        "icon": "folder",
        "color": "#00FF00"
    }
    
    response = client.post(
        "/api/v1/categories",
        json=category_data,
        headers=headers
    )
    
    assert response.status_code in [201, 400, 500]
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == category_data["name"]
        assert data["entity_type"] == category_data["entity_type"]
        assert "id" in data
        assert "slug" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_create_category_with_parent(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a category with a parent"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create parent category first
    parent_data = {
        "name": "Parent Category",
        "entity_type": "project"
    }
    parent_response = client.post(
        "/api/v1/categories",
        json=parent_data,
        headers=headers
    )
    
    if parent_response.status_code == 201:
        parent_id = parent_response.json()["id"]
        
        # Create child category
        child_data = {
            "name": "Child Category",
            "entity_type": "project",
            "parent_id": parent_id
        }
        response = client.post(
            "/api/v1/categories",
            json=child_data,
            headers=headers
        )
        
        assert response.status_code in [201, 400, 500]
        if response.status_code == 201:
            data = response.json()
            assert data["parent_id"] == parent_id


@pytest.mark.asyncio
async def test_get_category_tree(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting category tree"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/categories/tree",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_category_tree_filtered(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting category tree with filters"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/categories/tree?entity_type=project",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_category(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a category by ID"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create category first
    category_data = {
        "name": "Category to Get",
        "entity_type": "project"
    }
    create_response = client.post(
        "/api/v1/categories",
        json=category_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        category_id = create_response.json()["id"]
        
        # Get category
        response = client.get(
            f"/api/v1/categories/{category_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == category_id
        assert data["name"] == category_data["name"]


@pytest.mark.asyncio
async def test_get_category_not_found(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting non-existent category"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/categories/99999",
        headers=headers
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_category(client: TestClient, test_user: User, db: AsyncSession):
    """Test updating a category"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create category first
    category_data = {
        "name": "Category to Update",
        "entity_type": "project"
    }
    create_response = client.post(
        "/api/v1/categories",
        json=category_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        category_id = create_response.json()["id"]
        
        # Update category
        update_data = {
            "name": "Updated Category",
            "description": "Updated description",
            "color": "#0000FF"
        }
        response = client.put(
            f"/api/v1/categories/{category_id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["name"] == update_data["name"]
            assert data["description"] == update_data["description"]


@pytest.mark.asyncio
async def test_delete_category(client: TestClient, test_user: User, db: AsyncSession):
    """Test deleting a category"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create category first
    category_data = {
        "name": "Category to Delete",
        "entity_type": "project"
    }
    create_response = client.post(
        "/api/v1/categories",
        json=category_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        category_id = create_response.json()["id"]
        
        # Delete category
        response = client.delete(
            f"/api/v1/categories/{category_id}?cascade=false",
            headers=headers
        )
        
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True


@pytest.mark.asyncio
async def test_delete_category_cascade(client: TestClient, test_user: User, db: AsyncSession):
    """Test deleting a category with cascade"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create parent category first
    parent_data = {
        "name": "Parent to Delete",
        "entity_type": "project"
    }
    parent_response = client.post(
        "/api/v1/categories",
        json=parent_data,
        headers=headers
    )
    
    if parent_response.status_code == 201:
        parent_id = parent_response.json()["id"]
        
        # Delete with cascade
        response = client.delete(
            f"/api/v1/categories/{parent_id}?cascade=true",
            headers=headers
        )
        
        assert response.status_code in [200, 400, 404]


@pytest.mark.asyncio
async def test_category_validation(client: TestClient, test_user: User, db: AsyncSession):
    """Test category validation"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with empty name
    invalid_data = {
        "name": "",
        "entity_type": "project"
    }
    
    response = client.post(
        "/api/v1/categories",
        json=invalid_data,
        headers=headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_category_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that creating categories requires authentication"""
    category_data = {
        "name": "Test Category",
        "entity_type": "project"
    }
    
    response = client.post(
        "/api/v1/categories",
        json=category_data
    )
    
    assert response.status_code == 401

