"""
Unit tests for rate limiting
"""

import pytest
from fastapi import Request
from app.core.rate_limit import rate_limit_decorator


class TestRateLimit:
    """Test rate limiting decorator"""
    
    def test_rate_limit_decorator_exists(self):
        """Test that rate_limit_decorator exists and is callable"""
        assert callable(rate_limit_decorator)
        assert rate_limit_decorator is not None
    
    def test_rate_limit_decorator_returns_decorator(self):
        """Test that rate_limit_decorator returns a decorator"""
        decorator = rate_limit_decorator("10/minute")
        assert callable(decorator)

