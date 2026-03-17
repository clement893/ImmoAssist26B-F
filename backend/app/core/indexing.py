"""
Database Indexing Strategy
Provides utilities for creating and managing database indexes
"""

from typing import Optional
from sqlalchemy import Index, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger


class IndexStrategy:
    """Database indexing strategy utilities"""
    
    # Common index patterns
    INDEX_PATTERNS = {
        "primary_key": "Primary key (automatic)",
        "foreign_key": "Foreign key (automatic)",
        "unique": "Unique constraint (automatic)",
        "lookup": "Frequent lookup fields (email, username, etc.)",
        "filter": "Frequently filtered fields (is_active, status, etc.)",
        "sort": "Frequently sorted fields (created_at, updated_at, etc.)",
        "search": "Full-text search fields",
        "composite": "Composite indexes for multi-column queries",
    }
    
    @staticmethod
    async def create_index(
        session: AsyncSession,
        table_name: str,
        columns: list[str],
        index_name: Optional[str] = None,
        unique: bool = False,
        concurrently: bool = True,
    ) -> bool:
        """
        Create a database index
        
        Args:
            session: Database session
            table_name: Name of the table
            columns: List of column names
            index_name: Optional custom index name
            unique: Whether index should be unique
            concurrently: Create index concurrently (non-blocking)
        
        Returns:
            True if index was created successfully
        """
        if not index_name:
            index_name = f"idx_{table_name}_{'_'.join(columns)}"
        
        columns_str = ", ".join(columns)
        unique_str = "UNIQUE" if unique else ""
        concurrently_str = "CONCURRENTLY" if concurrently else ""
        
        try:
            sql = f"""
            CREATE INDEX {concurrently_str} {unique_str} IF NOT EXISTS {index_name}
            ON {table_name} ({columns_str})
            """
            
            await session.execute(text(sql))
            await session.commit()
            
            logger.info(f"Created index: {index_name} on {table_name}({columns_str})")
            return True
        except Exception as e:
            logger.error(f"Failed to create index {index_name}: {e}")
            await session.rollback()
            return False
    
    @staticmethod
    async def analyze_table(session: AsyncSession, table_name: str) -> bool:
        """
        Run ANALYZE on table to update statistics
        
        Args:
            session: Database session
            table_name: Name of the table
        
        Returns:
            True if analyze was successful
        """
        try:
            await session.execute(text(f"ANALYZE {table_name}"))
            await session.commit()
            logger.info(f"Analyzed table: {table_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to analyze table {table_name}: {e}")
            await session.rollback()
            return False
    
    @staticmethod
    async def get_index_info(session: AsyncSession, table_name: str) -> list[dict]:
        """
        Get index information for a table
        
        Args:
            session: Database session
            table_name: Name of the table
        
        Returns:
            List of index information dictionaries
        """
        sql = """
        SELECT
            indexname,
            indexdef,
            indisunique,
            indisprimary
        FROM pg_indexes
        WHERE tablename = :table_name
        """
        
        result = await session.execute(text(sql), {"table_name": table_name})
        rows = result.fetchall()
        
        return [
            {
                "name": row[0],
                "definition": row[1],
                "unique": row[2],
                "primary": row[3],
            }
            for row in rows
        ]
    
    @staticmethod
    async def drop_unused_indexes(session: AsyncSession, table_name: str) -> int:
        """
        Drop unused indexes (requires pg_stat_user_indexes)
        
        Args:
            session: Database session
            table_name: Name of the table
        
        Returns:
            Number of indexes dropped
        """
        # This is a simplified version - in production, you'd check pg_stat_user_indexes
        # to find indexes with idx_scan = 0
        logger.warning("drop_unused_indexes is not fully implemented - use with caution")
        return 0


# Recommended indexes for common patterns
RECOMMENDED_INDEXES = {
    "users": [
        {"columns": ["email"], "unique": True, "type": "lookup"},
        {"columns": ["is_active"], "type": "filter"},
        {"columns": ["created_at"], "type": "sort"},
        {"columns": ["email", "is_active"], "type": "composite"},
    ],
    "projects": [
        {"columns": ["user_id"], "type": "foreign_key"},
        {"columns": ["created_at"], "type": "sort"},
        {"columns": ["user_id", "created_at"], "type": "composite"},
    ],
}

