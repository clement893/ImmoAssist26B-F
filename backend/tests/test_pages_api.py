"""
Tests for Pages API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import Page
from app.models.user import User
from app.core.auth import create_access_token


# Note: These tests require the test fixtures from conftest.py
# Run with: pytest tests/test_pages_api.py -v


@pytest.mark.asyncio
async def test_create_page(client: AsyncClient, test_user: User, db: AsyncSession):
    """Test creating a new page"""
    from app.core.auth import create_access_token
    
    # Create auth token
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    page_data = {
        "title": "Test Page",
        "slug": "test-page",
        "content": "Test content",
        "status": "draft",
    }
    
    response = client.post(
        "/api/v1/pages",
        json=page_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == page_data["title"]
    assert data["slug"] == page_data["slug"]
    assert data["status"] == page_data["status"]


@pytest.mark.asyncio
async def test_get_page(client: AsyncClient, test_user: User, db: AsyncSession):
    """Test getting a page by slug"""
    # Create a test page
    page = Page(
        title="Test Page",
        slug="test-page",
        content="Test content",
        status="draft",
        user_id=test_user.id,
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    
    from app.core.auth import create_access_token
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        f"/api/v1/pages/test-page",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-page"
    assert data["title"] == "Test Page"


@pytest.mark.asyncio
async def test_list_pages(client: AsyncClient, test_user: User, db: AsyncSession):
    """Test listing pages"""
    # Create test pages
    for i in range(3):
        page = Page(
            title=f"Test Page {i}",
            slug=f"test-page-{i}",
            content=f"Content {i}",
            status="draft",
            user_id=test_user.id,
        )
        db.add(page)
    await db.commit()
    
    from app.core.auth import create_access_token
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/pages",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


@pytest.mark.asyncio
async def test_update_page(client: AsyncClient, test_user: User, db: AsyncSession):
    """Test updating a page"""
    # Create a test page
    page = Page(
        title="Test Page",
        slug="test-page",
        content="Test content",
        status="draft",
        user_id=test_user.id,
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    
    update_data = {
        "title": "Updated Page",
        "status": "published",
    }
    
    from app.core.auth import create_access_token
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.put(
        f"/api/v1/pages/test-page",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Page"
    assert data["status"] == "published"


@pytest.mark.asyncio
async def test_delete_page(client: AsyncClient, test_user: User, db: AsyncSession):
    """Test deleting a page"""
    # Create a test page
    page = Page(
        title="Test Page",
        slug="test-page",
        content="Test content",
        status="draft",
        user_id=test_user.id,
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    
    response = await client.delete(
        f"/api/v1/pages/test-page",
        headers=auth_headers
    )
    
    assert response.status_code == 204
    
    # Verify page is deleted
    get_response = await client.get(
        f"/api/v1/pages/test-page",
        headers=auth_headers
    )
    assert get_response.status_code == 404

