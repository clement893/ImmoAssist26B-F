"""
Tests for Team Service
"""

import pytest
from unittest.mock import AsyncMock, Mock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.team_service import TeamService
from app.models import Team, TeamMember, User, Role


class TestTeamService:
    """Tests for TeamService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock async database session"""
        db = AsyncMock(spec=AsyncSession)
        db.add = AsyncMock()
        db.commit = AsyncMock()
        db.execute = AsyncMock()
        return db
    
    @pytest.fixture
    def mock_team(self):
        """Mock team object"""
        team = Mock(spec=Team)
        team.id = 1
        team.name = "Test Team"
        team.slug = "test-team"
        team.owner_id = 1
        team.is_active = True
        return team
    
    @pytest.fixture
    def mock_admin_role(self):
        """Mock admin role"""
        role = Mock(spec=Role)
        role.id = 1
        role.slug = "admin"
        return role
    
    @pytest.mark.asyncio
    async def test_create_team(self, mock_db, mock_admin_role):
        """Test creating a new team"""
        # Mock admin role query
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_admin_role
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        
        team = await service.create_team(
            name="New Team",
            slug="new-team",
            owner_id=1,
            description="Test team"
        )
        
        assert mock_db.add.called
        assert mock_db.commit.called
    
    @pytest.mark.asyncio
    async def test_create_team_no_admin_role(self, mock_db):
        """Test creating team when admin role doesn't exist"""
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        
        with pytest.raises(ValueError, match="Admin role not found"):
            await service.create_team(
                name="New Team",
                slug="new-team",
                owner_id=1
            )
    
    @pytest.mark.asyncio
    async def test_get_team(self, mock_db, mock_team):
        """Test getting team by ID"""
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_team
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        result = await service.get_team(1)
        
        assert result == mock_team
    
    @pytest.mark.asyncio
    async def test_get_team_not_found(self, mock_db):
        """Test getting non-existent team"""
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        result = await service.get_team(999)
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_team_by_slug(self, mock_db, mock_team):
        """Test getting team by slug"""
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_team
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        result = await service.get_team_by_slug("test-team")
        
        assert result == mock_team
    
    @pytest.mark.asyncio
    async def test_get_user_teams(self, mock_db, mock_team):
        """Test getting teams for a user"""
        teams = [mock_team]
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = teams
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        result = await service.get_user_teams(user_id=1)
        
        assert result == teams
    
    @pytest.mark.asyncio
    async def test_get_user_teams_pagination(self, mock_db, mock_team):
        """Test getting user teams with pagination"""
        teams = [mock_team]
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = teams
        mock_db.execute.return_value = mock_result
        
        service = TeamService(mock_db)
        result = await service.get_user_teams(user_id=1, skip=10, limit=5)
        
        assert result == teams

