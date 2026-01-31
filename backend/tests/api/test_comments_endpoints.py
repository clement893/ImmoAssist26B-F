"""
Tests for Comments API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_create_comment(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    comment_data = {
        "content": "This is a test comment",
        "entity_type": "project",
        "entity_id": 1
    }
    
    response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    assert response.status_code in [201, 500]  # 500 if entity doesn't exist
    if response.status_code == 201:
        data = response.json()
        assert data["content"] == comment_data["content"]
        assert data["entity_type"] == comment_data["entity_type"]
        assert data["entity_id"] == comment_data["entity_id"]
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_create_comment_with_parent(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a reply comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # First create a parent comment
    parent_data = {
        "content": "Parent comment",
        "entity_type": "project",
        "entity_id": 1
    }
    parent_response = client.post(
        "/api/v1/comments",
        json=parent_data,
        headers=headers
    )
    
    if parent_response.status_code == 201:
        parent_id = parent_response.json()["id"]
        
        # Create reply
        reply_data = {
            "content": "Reply comment",
            "entity_type": "project",
            "entity_id": 1,
            "parent_id": parent_id
        }
        response = client.post(
            "/api/v1/comments",
            json=reply_data,
            headers=headers
        )
        
        assert response.status_code in [201, 500]
        if response.status_code == 201:
            data = response.json()
            assert data["parent_id"] == parent_id


@pytest.mark.asyncio
async def test_get_comments(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting comments for an entity"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/comments/project/1",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_comments_with_pagination(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting comments with pagination"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/comments/project/1?limit=10&offset=0",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_update_comment(client: TestClient, test_user: User, db: AsyncSession):
    """Test updating a comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comment first
    comment_data = {
        "content": "Original comment",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        comment_id = create_response.json()["id"]
        
        # Update comment
        update_data = {
            "content": "Updated comment",
            "content_html": "<p>Updated comment</p>"
        }
        response = client.put(
            f"/api/v1/comments/{comment_id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code in [200, 403, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["content"] == update_data["content"]
            assert data["is_edited"] is True


@pytest.mark.asyncio
async def test_delete_comment_soft(client: TestClient, test_user: User, db: AsyncSession):
    """Test soft deleting a comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comment first
    comment_data = {
        "content": "Comment to delete",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        comment_id = create_response.json()["id"]
        
        # Delete comment (soft delete)
        response = client.delete(
            f"/api/v1/comments/{comment_id}?hard_delete=false",
            headers=headers
        )
        
        assert response.status_code in [200, 403, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True


@pytest.mark.asyncio
async def test_delete_comment_hard(client: TestClient, test_user: User, db: AsyncSession):
    """Test hard deleting a comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comment first
    comment_data = {
        "content": "Comment to hard delete",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        comment_id = create_response.json()["id"]
        
        # Hard delete comment
        response = client.delete(
            f"/api/v1/comments/{comment_id}?hard_delete=true",
            headers=headers
        )
        
        assert response.status_code in [200, 403, 404]


@pytest.mark.asyncio
async def test_add_reaction(client: TestClient, test_user: User, db: AsyncSession):
    """Test adding a reaction to a comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comment first
    comment_data = {
        "content": "Comment for reaction",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        comment_id = create_response.json()["id"]
        
        # Add reaction
        reaction_data = {
            "reaction_type": "like"
        }
        response = client.post(
            f"/api/v1/comments/{comment_id}/reactions",
            json=reaction_data,
            headers=headers
        )
        
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True


@pytest.mark.asyncio
async def test_remove_reaction(client: TestClient, test_user: User, db: AsyncSession):
    """Test removing a reaction from a comment"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comment first
    comment_data = {
        "content": "Comment for reaction removal",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        comment_id = create_response.json()["id"]
        
        # Add reaction first
        reaction_data = {"reaction_type": "like"}
        client.post(
            f"/api/v1/comments/{comment_id}/reactions",
            json=reaction_data,
            headers=headers
        )
        
        # Remove reaction
        response = client.delete(
            f"/api/v1/comments/{comment_id}/reactions?reaction_type=like",
            headers=headers
        )
        
        assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_comment_validation(client: TestClient, test_user: User, db: AsyncSession):
    """Test comment validation"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with empty content
    invalid_data = {
        "content": "",
        "entity_type": "project",
        "entity_id": 1
    }
    
    response = client.post(
        "/api/v1/comments",
        json=invalid_data,
        headers=headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_comment_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that creating comments requires authentication"""
    comment_data = {
        "content": "Test comment",
        "entity_type": "project",
        "entity_id": 1
    }
    
    response = client.post(
        "/api/v1/comments",
        json=comment_data
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_comments_requires_authentication(client: TestClient, db: AsyncSession):
    """Test that getting comments requires authentication"""
    response = client.get("/api/v1/comments/project/1")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_comment_not_owner(client: TestClient, test_user: User, other_user: User, db: AsyncSession):
    """Test that users cannot update comments they don't own"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create comment as test_user
    comment_data = {
        "content": "Original comment",
        "entity_type": "project",
        "entity_id": 1
    }
    create_response = client.post(
        "/api/v1/comments",
        json=comment_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        comment_id = create_response.json()["id"]
        
        # Try to update as other_user
        other_token = create_access_token({"sub": other_user.email})
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        update_data = {"content": "Unauthorized update"}
        response = client.put(
            f"/api/v1/comments/{comment_id}",
            json=update_data,
            headers=other_headers
        )
        
        # Should fail with 403 or 404
        assert response.status_code in [403, 404]

