"""
Performance Tests for Caching
"""

import pytest
import time
from unittest.mock import AsyncMock
from app.core.cache_enhanced import EnhancedCache


@pytest.mark.performance
class TestCachePerformance:
    """Test cache performance"""
    
    @pytest.fixture
    def mock_cache_backend(self):
        """Mock cache backend with timing"""
        backend = AsyncMock()
        
        async def mock_get(key):
            # Simulate cache lookup time (fast)
            await asyncio.sleep(0.001)
            return None
        
        async def mock_set(key, value, expire, compress):
            # Simulate cache write time (fast)
            await asyncio.sleep(0.001)
            return True
        
        backend.get = mock_get
        backend.set = mock_set
        return backend
    
    @pytest.mark.asyncio
    async def test_cache_hit_performance(self, mock_cache_backend):
        """Test that cache hits are fast"""
        import asyncio
        
        cache = EnhancedCache(mock_cache_backend)
        
        # Set up cache hit
        mock_cache_backend.get.return_value = {"cached": "value"}
        
        async def slow_callable():
            await asyncio.sleep(0.1)  # Simulate slow operation
            return {"new": "value"}
        
        start_time = time.time()
        result = await cache.get_or_set("test_key", slow_callable)
        elapsed_time = time.time() - start_time
        
        # Cache hit should be much faster than slow callable
        assert elapsed_time < 0.05  # Should be < 50ms
        assert result == {"cached": "value"}
    
    @pytest.mark.asyncio
    async def test_cache_miss_performance(self, mock_cache_backend):
        """Test that cache misses don't add significant overhead"""
        import asyncio
        
        cache = EnhancedCache(mock_cache_backend)
        
        async def callable_fn():
            await asyncio.sleep(0.01)
            return {"value": "data"}
        
        start_time = time.time()
        result = await cache.get_or_set("test_key", callable_fn)
        elapsed_time = time.time() - start_time
        
        # Should complete in reasonable time
        assert elapsed_time < 0.1
        assert result == {"value": "data"}

