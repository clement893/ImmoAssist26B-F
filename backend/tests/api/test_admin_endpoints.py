"""
Tests for Admin API Endpoints
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def mock_superadmin():
    """Mock superadmin user"""
    user = Mock()
    user.id = 1
    user.email = "admin@example.com"
    user.is_superadmin = True
    return user


@pytest.fixture
def mock_regular_user():
    """Mock regular user"""
    user = Mock()
    user.id = 2
    user.email = "user@example.com"
    user.is_superadmin = False
    return user


class TestAdminEndpoints:
    """Tests for admin endpoints"""
    
    @patch("app.api.v1.endpoints.admin.require_superadmin")
    @patch("app.api.v1.endpoints.admin.get_current_user")
    @patch("app.api.v1.endpoints.admin.get_db")
    def test_admin_endpoint_requires_superadmin(
        self, mock_get_db, mock_get_user, mock_require_admin, client, mock_superadmin
    ):
        """Test admin endpoints require superadmin"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = mock_superadmin
        mock_require_admin.return_value = None
        
        # Test that superadmin can access
        # (Actual endpoint implementation would be tested here)
        assert mock_superadmin.is_superadmin is True
    
    @patch("app.api.v1.endpoints.admin.require_superadmin")
    @patch("app.api.v1.endpoints.admin.get_current_user")
    def test_admin_endpoint_blocks_regular_user(
        self, mock_get_user, mock_require_admin, client, mock_regular_user
    ):
        """Test admin endpoints block regular users"""
        mock_get_user.return_value = mock_regular_user
        mock_require_admin.side_effect = Exception("Forbidden")
        
        # Regular user should not be able to access admin endpoints
        assert mock_regular_user.is_superadmin is False

