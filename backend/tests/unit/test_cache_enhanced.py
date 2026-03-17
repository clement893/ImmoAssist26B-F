"""
Unit tests for enhanced cache utilities
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from app.core.cache_enhanced import EnhancedCache, cache_query, enhanced_cache


class TestEnhancedCache:
    """Test EnhancedCache class"""
    
    @pytest.fixture
    def mock_cache_backend(self):
        """Mock cache backend"""
        backend = AsyncMock()
        backend.get = AsyncMock(return_value=None)
        backend.set = AsyncMock(return_value=True)
        backend.delete = AsyncMock(return_value=True)
        return backend
    
    @pytest.fixture
    def cache(self, mock_cache_backend):
        """Create EnhancedCache instance"""
        return EnhancedCache(mock_cache_backend)
    
    @pytest.mark.asyncio
    async def test_get_or_set_cache_hit(self, cache, mock_cache_backend):
        """Test get_or_set when cache hit"""
        mock_cache_backend.get.return_value = {"cached": "value"}
        
        async def callable_fn():
            return {"new": "value"}
        
        result = await cache.get_or_set("test_key", callable_fn)
        
        assert result == {"cached": "value"}
        mock_cache_backend.get.assert_called_once_with("test_key")
        mock_cache_backend.set.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_or_set_cache_miss(self, cache, mock_cache_backend):
        """Test get_or_set when cache miss"""
        mock_cache_backend.get.return_value = None
        
        async def callable_fn():
            return {"new": "value"}
        
        result = await cache.get_or_set("test_key", callable_fn, expire=300)
        
        assert result == {"new": "value"}
        mock_cache_backend.get.assert_called_once_with("test_key")
        mock_cache_backend.set.assert_called_once_with("test_key", {"new": "value"}, 300, True)
    
    @pytest.mark.asyncio
    async def test_cache_query_result(self, cache, mock_cache_backend):
        """Test caching query result with tags"""
        result = {"data": "test"}
        success = await cache.cache_query_result("query_hash_123", result, expire=600, tags=["users"])
        
        assert success is True
        mock_cache_backend.set.assert_called()
    
    @pytest.mark.asyncio
    async def test_invalidate_by_tags(self, cache, mock_cache_backend):
        """Test invalidating cache by tags"""
        mock_cache_backend.get.return_value = ["query_hash_1", "query_hash_2"]
        
        invalidated = await cache.invalidate_by_tags(["users"])
        
        assert invalidated >= 0
        assert mock_cache_backend.delete.call_count >= 2
    
    @pytest.mark.asyncio
    async def test_warm_cache(self, cache, mock_cache_backend):
        """Test cache warming"""
        async def callable_1():
            return {"data": 1}
        
        async def callable_2():
            return {"data": 2}
        
        keys_and_callables = {
            "key1": callable_1,
            "key2": callable_2,
        }
        
        results = await cache.warm_cache(keys_and_callables)
        
        assert len(results) == 2
        assert results["key1"] is True
        assert results["key2"] is True

