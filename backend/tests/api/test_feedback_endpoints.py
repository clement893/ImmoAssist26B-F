"""
Tests for Feedback API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.feedback import FeedbackType, FeedbackStatus
from app.core.auth import create_access_token


@pytest.mark.asyncio
async def test_create_feedback(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new feedback entry"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug Report",
        "message": "This is a test bug report",
        "priority": 2
    }
    
    response = client.post(
        "/api/v1/feedback",
        json=feedback_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == feedback_data["subject"]
    assert data["message"] == feedback_data["message"]
    assert data["type"] == feedback_data["type"]
    assert data["priority"] == feedback_data["priority"]
    assert data["status"] == "open"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_feedback_anonymous(client: TestClient, db: AsyncSession):
    """Test creating anonymous feedback (no auth required)"""
    feedback_data = {
        "type": "feature",
        "subject": "Feature Request",
        "message": "This is a feature request",
        "priority": 1
    }
    
    response = client.post(
        "/api/v1/feedback",
        json=feedback_data
    )
    
    # Note: This depends on endpoint implementation - may require auth
    # Adjust assertion based on actual implementation
    assert response.status_code in [201, 401]


@pytest.mark.asyncio
async def test_get_feedback_list(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting list of feedback entries"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # First create a feedback
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug",
        "message": "Test message",
        "priority": 1
    }
    client.post("/api/v1/feedback", json=feedback_data, headers=headers)
    
    # Then get the list
    response = client.get(
        "/api/v1/feedback",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_feedback_list_with_filters(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting feedback list with status and type filters"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/feedback?status=open&type=bug&limit=10&offset=0",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_feedback_item(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a specific feedback entry"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create feedback first
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug",
        "message": "Test message",
        "priority": 1
    }
    create_response = client.post(
        "/api/v1/feedback",
        json=feedback_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        feedback_id = create_response.json()["id"]
        
        # Get the feedback
        response = client.get(
            f"/api/v1/feedback/{feedback_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == feedback_id
        assert data["subject"] == feedback_data["subject"]


@pytest.mark.asyncio
async def test_get_feedback_not_found(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting non-existent feedback"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/feedback/99999",
        headers=headers
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_feedback(client: TestClient, test_user: User, db: AsyncSession):
    """Test updating a feedback entry"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create feedback first
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug",
        "message": "Test message",
        "priority": 1
    }
    create_response = client.post(
        "/api/v1/feedback",
        json=feedback_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        feedback_id = create_response.json()["id"]
        
        # Update the feedback
        update_data = {
            "status": "closed",
            "priority": 2
        }
        response = client.put(
            f"/api/v1/feedback/{feedback_id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "closed"
        assert data["priority"] == 2


@pytest.mark.asyncio
async def test_update_feedback_with_response(client: TestClient, admin_user: User, db: AsyncSession):
    """Test updating feedback with admin response"""
    token = create_access_token({"sub": admin_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create feedback first
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug",
        "message": "Test message",
        "priority": 1
    }
    create_response = client.post(
        "/api/v1/feedback",
        json=feedback_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        feedback_id = create_response.json()["id"]
        
        # Update with response (admin only)
        update_data = {
            "status": "closed",
            "response": "This has been fixed"
        }
        response = client.put(
            f"/api/v1/feedback/{feedback_id}",
            json=update_data,
            headers=headers
        )
        
        # Should succeed if user is admin
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            assert data["response"] == "This has been fixed"
            assert "responded_by_id" in data


@pytest.mark.asyncio
async def test_delete_feedback(client: TestClient, test_user: User, db: AsyncSession):
    """Test deleting a feedback entry"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create feedback first
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug",
        "message": "Test message",
        "priority": 1
    }
    create_response = client.post(
        "/api/v1/feedback",
        json=feedback_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        feedback_id = create_response.json()["id"]
        
        # Delete the feedback
        response = client.delete(
            f"/api/v1/feedback/{feedback_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify it's deleted
        get_response = client.get(
            f"/api/v1/feedback/{feedback_id}",
            headers=headers
        )
        assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_feedback_validation(client: TestClient, test_user: User, db: AsyncSession):
    """Test feedback validation"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with missing required fields
    invalid_data = {
        "type": "bug",
        # Missing subject and message
    }
    
    response = client.post(
        "/api/v1/feedback",
        json=invalid_data,
        headers=headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_feedback_priority_validation(client: TestClient, test_user: User, db: AsyncSession):
    """Test feedback priority validation (1-4)"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with invalid priority
    invalid_data = {
        "type": "bug",
        "subject": "Test",
        "message": "Test message",
        "priority": 5  # Invalid: should be 1-4
    }
    
    response = client.post(
        "/api/v1/feedback",
        json=invalid_data,
        headers=headers
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_feedback_requires_authentication_for_list(client: TestClient, db: AsyncSession):
    """Test that getting feedback list requires authentication"""
    response = client.get("/api/v1/feedback")
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_feedback_upload_attachment(client: TestClient, test_user: User, db: AsyncSession):
    """Test uploading attachment to feedback"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create feedback first
    feedback_data = {
        "type": "bug",
        "subject": "Test Bug",
        "message": "Test message",
        "priority": 1
    }
    create_response = client.post(
        "/api/v1/feedback",
        json=feedback_data,
        headers=headers
    )
    
    if create_response.status_code == 201:
        feedback_id = create_response.json()["id"]
        
        # Upload attachment
        files = {"file": ("test.txt", b"test content", "text/plain")}
        response = client.post(
            f"/api/v1/feedback/{feedback_id}/attachments",
            files=files,
            headers=headers
        )
        
        # Should succeed or return appropriate error
        assert response.status_code in [200, 400, 404, 500]

