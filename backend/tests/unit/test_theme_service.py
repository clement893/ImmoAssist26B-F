"""
Tests for Theme Service
"""

import pytest
from unittest.mock import Mock, MagicMock
from sqlalchemy.orm import Session

from app.services.theme_service import ThemeService
from app.models.theme import Theme
from app.schemas.theme import ThemeCreate, ThemeUpdate


class TestThemeService:
    """Tests for ThemeService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        db = Mock(spec=Session)
        db.query = Mock()
        db.add = Mock()
        db.commit = Mock()
        db.refresh = Mock()
        return db
    
    @pytest.fixture
    def mock_theme(self):
        """Mock theme object"""
        theme = Mock(spec=Theme)
        theme.id = 1
        theme.name = "test-theme"
        theme.display_name = "Test Theme"
        theme.is_active = False
        return theme
    
    def test_get_active_theme(self, mock_db, mock_theme):
        """Test getting active theme"""
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = mock_theme
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        result = ThemeService.get_active_theme(mock_db)
        assert result == mock_theme
    
    def test_get_theme_by_id(self, mock_db, mock_theme):
        """Test getting theme by ID"""
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = mock_theme
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        result = ThemeService.get_theme_by_id(mock_db, 1)
        assert result == mock_theme
    
    def test_get_theme_by_name(self, mock_db, mock_theme):
        """Test getting theme by name"""
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = mock_theme
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        result = ThemeService.get_theme_by_name(mock_db, "test-theme")
        assert result == mock_theme
    
    def test_get_all_themes(self, mock_db, mock_theme):
        """Test getting all themes with pagination"""
        themes = [mock_theme]
        mock_query = Mock()
        mock_offset = Mock()
        mock_offset.limit.return_value.all.return_value = themes
        mock_query.offset.return_value = mock_offset
        mock_db.query.return_value = mock_query
        
        result = ThemeService.get_all_themes(mock_db, skip=0, limit=10)
        assert result == themes
    
    def test_create_theme(self, mock_db):
        """Test creating a new theme"""
        theme_data = ThemeCreate(
            name="new-theme",
            display_name="New Theme",
            description="Test theme",
            config={"colors": {"primary": "#000"}},
            is_active=False
        )
        
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.update.return_value = None
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        # Mock theme creation
        new_theme = Mock(spec=Theme)
        new_theme.id = 1
        mock_db.add.return_value = None
        
        result = ThemeService.create_theme(mock_db, theme_data)
        assert mock_db.add.called
        assert mock_db.commit.called
    
    def test_create_theme_activates(self, mock_db):
        """Test creating theme with is_active=True deactivates others"""
        theme_data = ThemeCreate(
            name="active-theme",
            display_name="Active Theme",
            is_active=True
        )
        
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.update.return_value = None
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        ThemeService.create_theme(mock_db, theme_data)
        # Should call deactivate_all_themes
        assert mock_db.commit.called
    
    def test_update_theme(self, mock_db, mock_theme):
        """Test updating a theme"""
        theme_data = ThemeUpdate(display_name="Updated Theme")
        
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = mock_theme
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        result = ThemeService.update_theme(mock_db, 1, theme_data)
        assert mock_db.commit.called
        assert mock_db.refresh.called
    
    def test_update_theme_not_found(self, mock_db):
        """Test updating non-existent theme"""
        theme_data = ThemeUpdate(display_name="Updated Theme")
        
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = None
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        result = ThemeService.update_theme(mock_db, 999, theme_data)
        assert result is None
    
    def test_delete_theme(self, mock_db, mock_theme):
        """Test deleting a theme"""
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = mock_theme
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        result = ThemeService.delete_theme(mock_db, 1)
        assert mock_db.commit.called
    
    def test_delete_active_theme_raises_error(self, mock_db, mock_theme):
        """Test deleting active theme raises error"""
        mock_theme.is_active = True
        
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.first.return_value = mock_theme
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        with pytest.raises(ValueError, match="Cannot delete the active theme"):
            ThemeService.delete_theme(mock_db, 1)
    
    def test_deactivate_all_themes(self, mock_db):
        """Test deactivating all themes"""
        mock_query = Mock()
        mock_filter = Mock()
        mock_filter.update.return_value = None
        mock_query.filter.return_value = mock_filter
        mock_db.query.return_value = mock_query
        
        ThemeService.deactivate_all_themes(mock_db)
        assert mock_db.commit.called

