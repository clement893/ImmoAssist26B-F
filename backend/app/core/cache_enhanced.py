"""
Enhanced Redis Cache Layer
Advanced caching with query result caching, cache warming, and invalidation strategies
"""

from typing import Optional, Any, Callable
from functools import wraps
import hashlib
import json
import asyncio

from app.core.cache import cache_backend, CacheBackend
from app.core.logging import logger


class EnhancedCache:
    """Enhanced caching layer with advanced features"""
    
    def __init__(self, cache_backend: CacheBackend):
        self.cache = cache_backend
    
    async def get_or_set(
        self,
        key: str,
        callable_fn: Callable,
        expire: int = 300,
        compress: bool = True,
        *args,
        **kwargs
    ) -> Any:
        """
        Get value from cache or set it using callable
        
        Args:
            key: Cache key
            callable_fn: Function to call if cache miss
            expire: Cache expiration in seconds
            compress: Whether to compress large values
            *args, **kwargs: Arguments to pass to callable_fn
        
        Returns:
            Cached or computed value
        """
        # Try to get from cache
        cached_value = await self.cache.get(key)
        if cached_value is not None:
            logger.debug(f"Cache hit: {key}")
            return cached_value
        
        # Cache miss - compute value
        logger.debug(f"Cache miss: {key}")
        if asyncio.iscoroutinefunction(callable_fn):
            value = await callable_fn(*args, **kwargs)
        else:
            value = callable_fn(*args, **kwargs) if args or kwargs else callable_fn()
        
        # Store in cache
        await self.cache.set(key, value, expire, compress)
        
        return value
    
    async def cache_query_result(
        self,
        query_hash: str,
        result: Any,
        expire: int = 300,
        tags: Optional[list[str]] = None,
    ) -> bool:
        """
        Cache database query result with tags for invalidation
        
        Args:
            query_hash: Hash of the query
            result: Query result to cache
            expire: Cache expiration in seconds
            tags: Optional tags for cache invalidation
        
        Returns:
            True if cached successfully
        """
        # Store result
        success = await self.cache.set(f"query:{query_hash}", result, expire)
        
        # Store tags for invalidation
        if tags and success:
            for tag in tags:
                tag_key = f"tag:{tag}"
                existing_queries = await self.cache.get(tag_key) or []
                if query_hash not in existing_queries:
                    existing_queries.append(query_hash)
                    await self.cache.set(tag_key, existing_queries, expire=86400)  # 24h
        
        return success
    
    async def invalidate_by_tags(self, tags: list[str]) -> int:
        """
        Invalidate cache entries by tags
        
        Args:
            tags: List of tags to invalidate
        
        Returns:
            Number of cache entries invalidated
        """
        invalidated = 0
        
        for tag in tags:
            tag_key = f"tag:{tag}"
            query_hashes = await self.cache.get(tag_key) or []
            
            for query_hash in query_hashes:
                if await self.cache.delete(f"query:{query_hash}"):
                    invalidated += 1
            
            # Clear tag
            await self.cache.delete(tag_key)
        
        return invalidated
    
    async def warm_cache(self, keys_and_callables: dict[str, Callable]) -> dict[str, bool]:
        """
        Warm cache with multiple entries
        
        Args:
            keys_and_callables: Dict mapping cache keys to callable functions
        
        Returns:
            Dict mapping keys to success status
        """
        results = {}
        
        for key, callable_fn in keys_and_callables.items():
            try:
                value = await callable_fn()
                success = await self.cache.set(key, value, expire=3600)
                results[key] = success
            except Exception as e:
                logger.error(f"Failed to warm cache for {key}: {e}")
                results[key] = False
        
        return results


# Enhanced cache instance
enhanced_cache = EnhancedCache(cache_backend)


def cache_query(expire: int = 300, tags: Optional[list[str]] = None):
    """
    Decorator to cache database query results
    
    Args:
        expire: Cache expiration in seconds
        tags: Optional tags for cache invalidation
    
    Usage:
        @cache_query(expire=600, tags=["users"])
        async def get_users():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function and arguments
            key_data = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
            query_hash = hashlib.md5(key_data.encode()).hexdigest()
            cache_key = f"query:{query_hash}"
            
            # Try cache
            cached = await cache_backend.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute query
            result = await func(*args, **kwargs)
            
            # Cache result
            await enhanced_cache.cache_query_result(
                query_hash,
                result,
                expire,
                tags,
            )
            
            return result
        
        # Add invalidation method
        async def invalidate(*args, **kwargs):
            """Invalidate cache for this query"""
            key_data = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
            query_hash = hashlib.md5(key_data.encode()).hexdigest()
            await cache_backend.delete(f"query:{query_hash}")
        
        wrapper.invalidate = invalidate
        return wrapper
    return decorator

