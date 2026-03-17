"""
Advanced Query Optimization Utilities
Query plan analysis, N+1 detection, and optimization helpers
"""

from typing import Any, Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, inspect
from sqlalchemy.engine import Result
from app.core.logging import logger
from app.core.cache_enhanced import cache_query


class QueryAnalyzer:
    """Analyze and optimize database queries"""
    
    @staticmethod
    async def explain_query(session: AsyncSession, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Get query execution plan using EXPLAIN ANALYZE
        
        Args:
            session: Database session
            query: SQL query string
            params: Query parameters
            
        Returns:
            Query execution plan
        """
        try:
            explain_query = f"EXPLAIN ANALYZE {query}"
            result = await session.execute(text(explain_query), params or {})
            plan_rows = result.fetchall()
            
            plan = {
                "query": query,
                "plan": "\n".join([str(row) for row in plan_rows]),
                "cost": None,
                "rows": None,
            }
            
            # Parse plan for cost and rows
            plan_str = plan["plan"]
            if "cost=" in plan_str:
                # Extract cost information
                import re
                cost_match = re.search(r'cost=([\d.]+)\.\.([\d.]+)', plan_str)
                if cost_match:
                    plan["cost"] = {
                        "startup": float(cost_match.group(1)),
                        "total": float(cost_match.group(2)),
                    }
            
            return plan
        except Exception as e:
            logger.error(f"Failed to explain query: {e}")
            return {"error": str(e)}
    
    @staticmethod
    async def analyze_slow_queries(session: AsyncSession, threshold_ms: float = 1000.0) -> List[Dict[str, Any]]:
        """
        Analyze slow queries from PostgreSQL pg_stat_statements
        
        Args:
            session: Database session
            threshold_ms: Threshold in milliseconds
            
        Returns:
            List of slow queries
        """
        try:
            # Check if pg_stat_statements extension is enabled
            check_ext = await session.execute(text("""
                SELECT EXISTS(
                    SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
                );
            """))
            extension_exists = check_ext.scalar()
            
            if not extension_exists:
                logger.warning("pg_stat_statements extension not enabled")
                return []
            
            # Get slow queries
            result = await session.execute(text("""
                SELECT 
                    query,
                    calls,
                    total_exec_time,
                    mean_exec_time,
                    max_exec_time,
                    stddev_exec_time
                FROM pg_stat_statements
                WHERE mean_exec_time > :threshold
                ORDER BY mean_exec_time DESC
                LIMIT 20;
            """), {"threshold": threshold_ms})
            
            slow_queries = []
            for row in result:
                slow_queries.append({
                    "query": row[0][:200],  # Truncate long queries
                    "calls": row[1],
                    "total_time_ms": row[2],
                    "mean_time_ms": row[3],
                    "max_time_ms": row[4],
                    "stddev_time_ms": row[5],
                })
            
            return slow_queries
        except Exception as e:
            logger.error(f"Failed to analyze slow queries: {e}")
            return []
    
    @staticmethod
    async def get_table_statistics(session: AsyncSession, table_name: str) -> Dict[str, Any]:
        """
        Get table statistics for optimization
        
        Args:
            session: Database session
            table_name: Name of the table
            
        Returns:
            Table statistics
        """
        try:
            result = await session.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation,
                    most_common_vals,
                    most_common_freqs
                FROM pg_stats
                WHERE tablename = :table_name
                LIMIT 20;
            """), {"table_name": table_name})
            
            stats = []
            for row in result:
                stats.append({
                    "column": row[2],
                    "distinct_values": row[3],
                    "correlation": row[4],
                    "most_common": row[5],
                    "frequencies": row[6],
                })
            
            return {
                "table": table_name,
                "statistics": stats,
            }
        except Exception as e:
            logger.error(f"Failed to get table statistics: {e}")
            return {"error": str(e)}


class QueryOptimizer:
    """Optimize database queries"""
    
    @staticmethod
    def detect_n_plus_one(queries: List[str]) -> List[Dict[str, Any]]:
        """
        Detect potential N+1 query patterns
        
        Args:
            queries: List of query strings
            
        Returns:
            List of detected N+1 patterns
        """
        n_plus_one_patterns = []
        
        # Simple pattern detection
        for i, query in enumerate(queries):
            # Look for queries in loops (simplified detection)
            if "SELECT" in query.upper() and "WHERE" in query.upper():
                # Check if this query pattern appears multiple times
                count = queries.count(query)
                if count > 5:  # Threshold for N+1 detection
                    n_plus_one_patterns.append({
                        "query": query[:100],
                        "occurrences": count,
                        "suggestion": "Consider using JOIN or eager loading",
                    })
        
        return n_plus_one_patterns
    
    @staticmethod
    async def suggest_indexes(session: AsyncSession, table_name: str, column_name: str) -> List[str]:
        """
        Suggest indexes for a table column
        
        Args:
            session: Database session
            table_name: Name of the table
            column_name: Name of the column
            
        Returns:
            List of suggested index SQL statements
        """
        suggestions = []
        
        try:
            # Check if index already exists
            result = await session.execute(text("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = :table_name
                AND indexdef LIKE :column_pattern;
            """), {
                "table_name": table_name,
                "column_pattern": f"%{column_name}%",
            })
            
            existing_indexes = [row[0] for row in result]
            
            if not existing_indexes:
                suggestions.append(
                    f"CREATE INDEX idx_{table_name}_{column_name} ON {table_name}({column_name});"
                )
        except Exception as e:
            logger.error(f"Failed to suggest indexes: {e}")
        
        return suggestions


# Decorator for automatic query optimization
def optimize_query(use_cache: bool = True, cache_expire: int = 300):
    """
    Decorator to optimize database queries with caching and analysis
    
    Usage:
        @optimize_query(use_cache=True, cache_expire=600)
        async def get_users():
            ...
    """
    def decorator(func):
        if use_cache:
            # Apply caching decorator
            return cache_query(expire=cache_expire)(func)
        return func
    return decorator




