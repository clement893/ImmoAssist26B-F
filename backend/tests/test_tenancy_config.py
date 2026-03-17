"""
Tests for tenancy configuration

Tests verify that TenancyConfig works correctly in all modes
and that TenantMixin is conditionally applied.
"""

import os
import pytest
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

from app.core.tenancy import TenancyConfig, TenancyMode
from app.core.mixins import TenantMixin


Base = declarative_base()


class TestTenancyConfig:
    """Test TenancyConfig class"""
    
    def test_default_mode_is_single(self):
        """Test that default mode is single"""
        # Reset config
        TenancyConfig.reset()
        # Set environment to single (or unset)
        os.environ.pop("TENANCY_MODE", None)
        
        assert TenancyConfig.get_mode() == TenancyMode.SINGLE
        assert TenancyConfig.is_single_mode() is True
        assert TenancyConfig.is_enabled() is False
    
    def test_single_mode_disables_tenancy(self):
        """Test that single mode disables tenancy"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "single"
        
        assert TenancyConfig.is_enabled() is False
        assert TenancyConfig.is_single_mode() is True
        assert TenancyConfig.is_shared_db_mode() is False
        assert TenancyConfig.is_separate_db_mode() is False
    
    def test_shared_db_mode_enables_tenancy(self):
        """Test that shared_db mode enables tenancy"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "shared_db"
        
        assert TenancyConfig.is_enabled() is True
        assert TenancyConfig.is_single_mode() is False
        assert TenancyConfig.is_shared_db_mode() is True
        assert TenancyConfig.is_separate_db_mode() is False
    
    def test_separate_db_mode_enables_tenancy(self):
        """Test that separate_db mode enables tenancy"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "separate_db"
        
        assert TenancyConfig.is_enabled() is True
        assert TenancyConfig.is_single_mode() is False
        assert TenancyConfig.is_shared_db_mode() is False
        assert TenancyConfig.is_separate_db_mode() is True
    
    def test_invalid_mode_defaults_to_single(self):
        """Test that invalid mode defaults to single"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "invalid_mode"
        
        assert TenancyConfig.get_mode() == TenancyMode.SINGLE
        assert TenancyConfig.is_enabled() is False
    
    def test_mode_case_insensitive(self):
        """Test that mode is case insensitive"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "SHARED_DB"
        
        assert TenancyConfig.get_mode() == TenancyMode.SHARED_DB
        assert TenancyConfig.is_enabled() is True


class TestTenantMixin:
    """Test TenantMixin conditional application"""
    
    def test_mixin_in_single_mode(self):
        """Test that TenantMixin doesn't add team_id in single mode"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "single"
        
        # Re-import to get fresh mixin
        import importlib
        import app.core.mixins
        importlib.reload(app.core.mixins)
        from app.core.mixins import TenantMixin
        
        class TestModel(TenantMixin, Base):
            __tablename__ = "test_model"
            id = Column(Integer, primary_key=True)
            name = Column(String(200))
        
        # In single mode, team_id should not exist
        assert not hasattr(TestModel, 'team_id')
        assert not hasattr(TestModel, 'team')
    
    @pytest.mark.skipif(
        os.getenv("TENANCY_MODE", "single") == "single",
        reason="Requires tenancy mode to be enabled"
    )
    def test_mixin_in_shared_db_mode(self):
        """Test that TenantMixin adds team_id in shared_db mode"""
        TenancyConfig.reset()
        os.environ["TENANCY_MODE"] = "shared_db"
        
        # Re-import to get fresh mixin
        import importlib
        import app.core.mixins
        importlib.reload(app.core.mixins)
        from app.core.mixins import TenantMixin
        
        class TestModel(TenantMixin, Base):
            __tablename__ = "test_model"
            id = Column(Integer, primary_key=True)
            name = Column(String(200))
        
        # In shared_db mode, team_id should exist
        assert hasattr(TestModel, 'team_id')
        assert hasattr(TestModel, 'team')

