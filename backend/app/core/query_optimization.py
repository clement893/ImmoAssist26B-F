"""
Database Query Optimization Utilities
Provides utilities for optimizing database queries
"""

from typing import Optional, List, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload, contains_eager
from sqlalchemy.sql import Select

from app.core.logging import logger


class QueryOptimizer:
    """Query optimization utilities"""
    
    @staticmethod
    def add_eager_loading(query: Select, relationships: List[str], strategy: str = "selectin") -> Select:
        """
        Add eager loading to prevent N+1 queries
        
        Args:
            query: SQLAlchemy select query
            relationships: List of relationship names to eager load
            strategy: Loading strategy ('selectin', 'joined', or 'contains_eager')
        
        Returns:
            Optimized query with eager loading
        """
        for rel in relationships:
            if strategy == "selectin":
                query = query.options(selectinload(rel))
            elif strategy == "joined":
                query = query.options(joinedload(rel))
            elif strategy == "contains_eager":
                query = query.options(contains_eager(rel))
        
        return query
    
    @staticmethod
    def add_select_fields(query: Select, fields: List[str]) -> Select:
        """
        Select only needed fields to reduce data transfer
        
        Args:
            query: SQLAlchemy select query
            fields: List of field names to select
        
        Returns:
            Query with selected fields only
        """
        # This is a simplified version - in practice, you'd map field names to columns
        # For now, return the query as-is (field selection should be done at model level)
        return query
    
    @staticmethod
    def add_index_hint(query: Select, index_name: str) -> Select:
        """
        Add index hint to query (PostgreSQL specific)
        
        Args:
            query: SQLAlchemy select query
            index_name: Name of index to use
        
        Returns:
            Query with index hint
        """
        # PostgreSQL index hints via text()
        from sqlalchemy import text
        # 
        # NOTE: This is a simplified example - actual implementation depends on use case
        # Override this method in your specific query optimization classes for production use
        return query
    
    @staticmethod
    def optimize_join_order(query: Select) -> Select:
        """
        Optimize join order (simplified - actual optimization requires query planner)
        
        Args:
            query: SQLAlchemy select query
        
        Returns:
            Query with optimized joins
        """
        # In practice, PostgreSQL query planner handles this
        # But we can ensure joins are properly structured
        return query


async def explain_query(session: AsyncSession, query: Select) -> List[dict]:
    """
    Explain a query to analyze execution plan
    
    Args:
        session: Database session
        query: SQLAlchemy select query
    
    Returns:
        List of execution plan rows
    """
    # Convert to EXPLAIN query
    from sqlalchemy import text as sql_text
    explain_query_str = f"EXPLAIN ANALYZE {str(query.compile(compile_kwargs={'literal_binds': True}))}"
    
    result = await session.execute(sql_text(explain_query_str))
    rows = result.fetchall()
    
    return [dict(row) for row in rows]


def log_slow_query(query: Select, execution_time: float, threshold: float = 1.0):
    """
    Log slow queries for optimization
    
    Args:
        query: SQLAlchemy select query
        execution_time: Query execution time in seconds
        threshold: Threshold in seconds to consider query slow
    """
    if execution_time > threshold:
        logger.warning(
            f"Slow query detected ({execution_time:.2f}s): {str(query)}"
        )


class QueryCache:
    """Query result caching"""
    
    @staticmethod
    def get_cache_key(query: Select, params: dict) -> str:
        """Generate cache key for query"""
        import hashlib
        query_str = str(query.compile(compile_kwargs={'literal_binds': True}))
        params_str = str(sorted(params.items()))
        key_data = f"{query_str}:{params_str}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    @staticmethod
    async def cached_query(
        session: AsyncSession,
        query: Select,
        cache_key: str,
        cache_backend,
        expire: int = 300,
    ) -> Optional[Any]:
        """
        Execute query with caching
        
        Args:
            session: Database session
            query: SQLAlchemy select query
            cache_key: Cache key
            cache_backend: Cache backend instance
            expire: Cache expiration in seconds
        
        Returns:
            Cached result or None
        """
        # Check cache
        cached = await cache_backend.get(cache_key)
        if cached is not None:
            return cached
        
        # Execute query
        result = await session.execute(query)
        data = result.scalars().all()
        
        # Cache result
        await cache_backend.set(cache_key, list(data), expire)
        
        return list(data)

