"""
Tests for SEO API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.core.auth import create_access_token


def test_get_seo_settings(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting SEO settings"""
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/seo/settings",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data


def test_update_seo_settings(client: TestClient, test_user: User, db: AsyncSession):
    """Test updating SEO settings"""
    settings_data = {
        "title": "Test Site",
        "description": "Test description",
        "keywords": "test, keywords",
        "robots": "index, follow",
        "og_title": "Test OG Title",
        "og_description": "Test OG Description",
    }
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.put(
        "/api/v1/seo/settings",
        json=settings_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "settings" in data
    
    # Verify settings were saved
    get_response = client.get(
        "/api/v1/seo/settings",
        headers=headers
    )
    assert get_response.status_code == 200
    saved_settings = get_response.json()["settings"]
    assert saved_settings.get("title") == settings_data["title"]

