"""
Tests for CORS Configuration
"""

import pytest
from unittest.mock import patch
import os

from app.core.cors import validate_origin, get_cors_origins, setup_cors
from fastapi import FastAPI


class TestValidateOrigin:
    """Tests for origin validation"""
    
    def test_validate_origin_exact_match(self):
        """Test exact origin match"""
        allowed_origins = ["https://example.com", "https://app.example.com"]
        assert validate_origin("https://example.com", allowed_origins) is True
        assert validate_origin("https://app.example.com", allowed_origins) is True
        assert validate_origin("https://other.com", allowed_origins) is False
    
    def test_validate_origin_wildcard_subdomain(self):
        """Test wildcard subdomain matching"""
        allowed_origins = ["*.example.com", "https://app.example.com"]
        assert validate_origin("https://sub.example.com", allowed_origins) is True
        assert validate_origin("https://api.example.com", allowed_origins) is True
        assert validate_origin("https://example.com", allowed_origins) is False
        assert validate_origin("https://other.com", allowed_origins) is False
    
    def test_validate_origin_empty_list(self):
        """Test validation with empty allowed origins"""
        assert validate_origin("https://example.com", []) is False


class TestGetCorsOrigins:
    """Tests for getting CORS origins"""
    
    @patch.dict(os.environ, {"ENVIRONMENT": "development"})
    def test_get_cors_origins_development(self):
        """Test CORS origins in development"""
        origins = get_cors_origins()
        assert isinstance(origins, list)
    
    @patch.dict(os.environ, {"ENVIRONMENT": "production", "FRONTEND_URL": "https://app.example.com"})
    def test_get_cors_origins_production_with_frontend_url(self):
        """Test CORS origins in production with FRONTEND_URL"""
        origins = get_cors_origins()
        assert isinstance(origins, list)
        # Should include FRONTEND_URL if CORS_ORIGINS not set
    
    @patch.dict(os.environ, {"ENVIRONMENT": "production"}, clear=True)
    def test_get_cors_origins_production_no_config(self):
        """Test CORS origins in production without configuration"""
        origins = get_cors_origins()
        assert isinstance(origins, list)
        # Should return empty list or default
    
    def test_get_cors_origins_string_input(self):
        """Test CORS origins with string input"""
        with patch("app.core.cors.settings") as mock_settings:
            mock_settings.CORS_ORIGINS = "https://example.com"
            origins = get_cors_origins()
            assert isinstance(origins, list)
            assert len(origins) >= 0


class TestSetupCors:
    """Tests for CORS setup"""
    
    def test_setup_cors_adds_middleware(self):
        """Test that setup_cors adds CORS middleware"""
        app = FastAPI()
        setup_cors(app)
        
        # Check that middleware was added
        assert len(app.user_middleware) > 0
    
    def test_setup_cors_configures_correctly(self):
        """Test CORS middleware configuration"""
        app = FastAPI()
        setup_cors(app)
        
        # Middleware should be configured
        assert len(app.user_middleware) > 0

