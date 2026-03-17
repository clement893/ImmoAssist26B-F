"""
Tests for Project API Endpoints
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.project import Project, ProjectStatus


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def mock_project():
    """Mock project object"""
    project = Mock(spec=Project)
    project.id = 1
    project.name = "Test Project"
    project.description = "Test description"
    project.status = ProjectStatus.ACTIVE
    project.user_id = 1
    project.created_at = "2025-01-27T10:00:00Z"
    return project


@pytest.fixture
def mock_user():
    """Mock user object"""
    user = Mock()
    user.id = 1
    user.email = "test@example.com"
    return user


class TestGetProjects:
    """Tests for GET /api/v1/projects"""
    
    @patch("app.api.v1.endpoints.projects.get_current_user")
    @patch("app.api.v1.endpoints.projects.get_db")
    def test_get_projects_success(self, mock_get_db, mock_get_user, client, mock_project, mock_user):
        """Test getting projects list"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [mock_project]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = mock_user
        
        response = client.get("/api/v1/projects", headers={"Authorization": "Bearer test-token"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch("app.api.v1.endpoints.projects.get_current_user")
    @patch("app.api.v1.endpoints.projects.get_db")
    def test_get_projects_with_status_filter(self, mock_get_db, mock_get_user, client, mock_project, mock_user):
        """Test getting projects with status filter"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [mock_project]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = mock_user
        
        response = client.get(
            "/api/v1/projects?status=ACTIVE",
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == 200
    
    @patch("app.api.v1.endpoints.projects.get_current_user")
    @patch("app.api.v1.endpoints.projects.get_db")
    def test_get_projects_pagination(self, mock_get_db, mock_get_user, client, mock_project, mock_user):
        """Test getting projects with pagination"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = mock_user
        
        response = client.get(
            "/api/v1/projects?skip=10&limit=5",
            headers={"Authorization": "Bearer test-token"}
        )
        assert response.status_code == 200


class TestGetProject:
    """Tests for GET /api/v1/projects/{project_id}"""
    
    @patch("app.api.v1.endpoints.projects.get_current_user")
    @patch("app.api.v1.endpoints.projects.get_db")
    def test_get_project_success(self, mock_get_db, mock_get_user, client, mock_project, mock_user):
        """Test getting project by ID"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_project
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = mock_user
        
        response = client.get("/api/v1/projects/1", headers={"Authorization": "Bearer test-token"})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
    
    @patch("app.api.v1.endpoints.projects.get_current_user")
    @patch("app.api.v1.endpoints.projects.get_db")
    def test_get_project_not_found(self, mock_get_db, mock_get_user, client, mock_user):
        """Test getting non-existent project"""
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = mock_user
        
        response = client.get("/api/v1/projects/999", headers={"Authorization": "Bearer test-token"})
        assert response.status_code == 404
    
    @patch("app.api.v1.endpoints.projects.get_current_user")
    @patch("app.api.v1.endpoints.projects.get_db")
    def test_get_project_unauthorized(self, mock_get_db, mock_get_user, client, mock_project):
        """Test getting project user doesn't own"""
        other_user = Mock()
        other_user.id = 2
        
        mock_db = AsyncMock(spec=AsyncSession)
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None  # Not found because user_id doesn't match
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_get_db.return_value = mock_db
        mock_get_user.return_value = other_user
        
        response = client.get("/api/v1/projects/1", headers={"Authorization": "Bearer test-token"})
        assert response.status_code == 404  # Returns 404, not 403 (security by obscurity)

