"""
Slow Query Logger
Logs slow database queries for performance monitoring and optimization
"""

import time
from functools import wraps
from typing import Callable, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.core.config import settings
from app.core.logging import logger


# Default threshold: 1 second
try:
    SLOW_QUERY_THRESHOLD = float(settings.SLOW_QUERY_THRESHOLD)
except AttributeError:
    SLOW_QUERY_THRESHOLD = 1.0


def log_slow_query(query: Select, execution_time: float, threshold: float = SLOW_QUERY_THRESHOLD):
    """
    Log slow queries for optimization
    
    Args:
        query: SQLAlchemy select query
        execution_time: Query execution time in seconds
        threshold: Threshold in seconds to consider query slow
    """
    if execution_time > threshold:
        query_str = str(query.compile(compile_kwargs={'literal_binds': True}))
        logger.warning(
            f"Slow query detected ({execution_time:.3f}s > {threshold}s threshold)",
            extra={
                "query": query_str[:500],  # Limit query string length
                "execution_time": execution_time,
                "threshold": threshold,
            }
        )


async def log_slow_query_async(query: Select, execution_time: float, threshold: float = SLOW_QUERY_THRESHOLD):
    """
    Async version of slow query logger
    
    Args:
        query: SQLAlchemy select query
        execution_time: Query execution time in seconds
        threshold: Threshold in seconds to consider query slow
    """
    log_slow_query(query, execution_time, threshold)


class SlowQueryMiddleware:
    """
    Middleware to log slow queries automatically
    """
    
    def __init__(self, threshold: float = SLOW_QUERY_THRESHOLD):
        self.threshold = threshold
    
    async def execute_with_logging(
        self,
        session: AsyncSession,
        query: Select,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute query with slow query logging
        
        Args:
            session: Database session
            query: SQLAlchemy select query
            *args, **kwargs: Additional arguments for execute
        
        Returns:
            Query result
        """
        start_time = time.time()
        try:
            result = await session.execute(query, *args, **kwargs)
            execution_time = time.time() - start_time
            
            if execution_time > self.threshold:
                log_slow_query(query, execution_time, self.threshold)
            
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                f"Query failed after {execution_time:.3f}s",
                extra={
                    "query": str(query)[:500],
                    "execution_time": execution_time,
                    "error": str(e),
                }
            )
            raise


def slow_query_logger(threshold: float = SLOW_QUERY_THRESHOLD):
    """
    Decorator to log slow queries for a function
    
    Usage:
        @slow_query_logger(threshold=0.5)
        async def get_users():
            ...
    
    Args:
        threshold: Threshold in seconds to consider query slow
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                if execution_time > threshold:
                    logger.warning(
                        f"Slow query in {func.__name__}: {execution_time:.3f}s",
                        extra={
                            "function": func.__name__,
                            "execution_time": execution_time,
                            "threshold": threshold,
                        }
                    )
                
                return result
            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(
                    f"Query failed in {func.__name__} after {execution_time:.3f}s",
                    extra={
                        "function": func.__name__,
                        "execution_time": execution_time,
                        "error": str(e),
                    }
                )
                raise
        
        return wrapper
    return decorator

