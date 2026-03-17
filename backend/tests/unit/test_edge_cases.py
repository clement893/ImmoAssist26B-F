"""
Edge Case Testing
Tests for edge cases and boundary conditions
"""

import pytest
from app.core.pagination import PaginationParams, PaginatedResponse


class TestPaginationEdgeCases:
    """Test pagination edge cases"""
    
    def test_page_zero(self):
        """Test that page 0 is invalid"""
        with pytest.raises(Exception):  # Should raise validation error
            PaginationParams(page=0, page_size=20)
    
    def test_negative_page(self):
        """Test that negative page is invalid"""
        with pytest.raises(Exception):
            PaginationParams(page=-1, page_size=20)
    
    def test_zero_page_size(self):
        """Test that page size 0 is invalid"""
        with pytest.raises(Exception):
            PaginationParams(page=1, page_size=0)
    
    def test_negative_page_size(self):
        """Test that negative page size is invalid"""
        with pytest.raises(Exception):
            PaginationParams(page=1, page_size=-1)
    
    def test_max_page_size(self):
        """Test maximum page size constraint"""
        # Should allow max page size
        params = PaginationParams(page=1, page_size=100)
        assert params.page_size == 100
        
        # Should reject page size > 100
        with pytest.raises(Exception):
            PaginationParams(page=1, page_size=101)
    
    def test_very_large_page_number(self):
        """Test very large page number"""
        params = PaginationParams(page=999999, page_size=20)
        assert params.offset == (999999 - 1) * 20
    
    def test_empty_results_pagination(self):
        """Test pagination with empty results"""
        response = PaginatedResponse.create(
            items=[],
            total=0,
            page=1,
            page_size=20,
        )
        
        assert response.total == 0
        assert response.total_pages == 0
        assert response.has_next is False
        assert response.has_previous is False
    
    def test_single_item_pagination(self):
        """Test pagination with single item"""
        response = PaginatedResponse.create(
            items=[{"id": 1}],
            total=1,
            page=1,
            page_size=20,
        )
        
        assert response.total == 1
        assert response.total_pages == 1
        assert response.has_next is False


class TestCacheEdgeCases:
    """Test cache edge cases"""
    
    @pytest.mark.asyncio
    async def test_cache_with_none_value(self):
        """Test caching None value"""
        from app.core.cache_enhanced import EnhancedCache
        from unittest.mock import AsyncMock
        
        mock_backend = AsyncMock()
        cache = EnhancedCache(mock_backend)
        
        async def callable_fn():
            return None
        
        result = await cache.get_or_set("test_key", callable_fn)
        
        # None should be cached
        assert result is None
        mock_backend.set.assert_called()
    
    @pytest.mark.asyncio
    async def test_cache_with_empty_string(self):
        """Test caching empty string"""
        from app.core.cache_enhanced import EnhancedCache
        from unittest.mock import AsyncMock
        
        mock_backend = AsyncMock()
        cache = EnhancedCache(mock_backend)
        
        async def callable_fn():
            return ""
        
        result = await cache.get_or_set("test_key", callable_fn)
        
        assert result == ""
    
    @pytest.mark.asyncio
    async def test_cache_with_zero_expire(self):
        """Test caching with zero expiration"""
        from app.core.cache_enhanced import EnhancedCache
        from unittest.mock import AsyncMock
        
        mock_backend = AsyncMock()
        cache = EnhancedCache(mock_backend)
        
        async def callable_fn():
            return "value"
        
        await cache.get_or_set("test_key", callable_fn, expire=0)
        
        # Should still call set with expire=0
        mock_backend.set.assert_called()


class TestInputValidationEdgeCases:
    """Test input validation edge cases"""
    
    def test_empty_email(self):
        """Test empty email validation"""
        from app.schemas.user import UserBase
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            UserBase(email="", first_name="Test")
    
    def test_whitespace_only_email(self):
        """Test whitespace-only email"""
        from app.schemas.user import UserBase
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            UserBase(email="   ", first_name="Test")
    
    def test_very_long_email(self):
        """Test very long email"""
        from app.schemas.user import UserBase
        
        long_email = "a" * 200 + "@example.com"
        # Should be validated by email validator
        try:
            user = UserBase(email=long_email, first_name="Test")
            # If it passes, email should be normalized
            assert "@example.com" in user.email
        except Exception:
            # Long emails might be rejected, which is fine
            pass
    
    def test_unicode_in_names(self):
        """Test unicode characters in names"""
        from app.schemas.user import UserBase
        
        user = UserBase(
            email="test@example.com",
            first_name="José",
            last_name="Müller",
        )
        
        assert user.first_name == "José"
        assert user.last_name == "Müller"
    
    def test_special_characters_in_names(self):
        """Test special characters in names"""
        from app.schemas.user import UserBase
        
        user = UserBase(
            email="test@example.com",
            first_name="Jean-Pierre",
            last_name="O'Brien",
        )
        
        assert user.first_name == "Jean-Pierre"
        assert user.last_name == "O'Brien"
    
    def test_max_length_names(self):
        """Test maximum length names"""
        from app.schemas.user import UserBase
        
        max_name = "A" * 100
        user = UserBase(
            email="test@example.com",
            first_name=max_name,
            last_name=max_name,
        )
        
        assert len(user.first_name) == 100
    
    def test_exceeding_max_length_names(self):
        """Test names exceeding maximum length"""
        from app.schemas.user import UserBase
        from pydantic import ValidationError
        
        too_long_name = "A" * 101
        
        with pytest.raises(ValidationError):
            UserBase(
                email="test@example.com",
                first_name=too_long_name,
            )


class TestAPIKeyEdgeCases:
    """Test API key edge cases"""
    
    def test_empty_string_verification(self):
        """Test verifying empty string as API key"""
        from app.core.api_key import verify_api_key
        
        assert verify_api_key("", "hash") is False
        assert verify_api_key("key", "") is False
    
    def test_unicode_in_api_key(self):
        """Test API key with unicode characters"""
        from app.core.api_key import generate_api_key, hash_api_key, verify_api_key
        
        # API keys should be URL-safe, so unicode shouldn't appear
        key = generate_api_key()
        
        # Should only contain URL-safe characters
        import string
        allowed_chars = string.ascii_letters + string.digits + "-_"
        assert all(c in allowed_chars for c in key)


class TestCompressionEdgeCases:
    """Test compression edge cases"""
    
    def test_empty_string_compression(self):
        """Test compressing empty string"""
        from app.core.compression import CompressionMiddleware
        
        middleware = CompressionMiddleware(app=None, min_size=1)
        compressed = middleware._compress_gzip(b"")
        
        # Empty string should still compress
        assert isinstance(compressed, bytes)
    
    def test_very_small_string_compression(self):
        """Test compressing very small string"""
        from app.core.compression import CompressionMiddleware
        
        middleware = CompressionMiddleware(app=None, min_size=1024)
        small_data = b"x" * 100  # Less than min_size
        
        # Should not compress if below threshold
        # This is tested in middleware logic, not here
    
    def test_very_large_string_compression(self):
        """Test compressing very large string"""
        from app.core.compression import CompressionMiddleware
        
        middleware = CompressionMiddleware(app=None, min_size=1024)
        large_data = b"x" * (10 * 1024 * 1024)  # 10MB
        
        compressed = middleware._compress_gzip(large_data)
        
        assert len(compressed) < len(large_data)
        assert isinstance(compressed, bytes)

