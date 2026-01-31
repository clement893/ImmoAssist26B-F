"""
Database migration utilities
Handles automatic schema migrations for missing columns
"""

from sqlalchemy import text
from app.core.database import engine
from app.core.logging import logger


async def ensure_theme_preference_column() -> None:
    """
    Ensure theme_preference column exists in users table.
    This is a temporary fix until proper migrations are run.
    """
    try:
        async with engine.begin() as conn:
            # Check if column exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'theme_preference'
            """))
            
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                logger.info("Adding missing theme_preference column to users table...")
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN theme_preference VARCHAR(20) NOT NULL DEFAULT 'system'
                """))
                await conn.commit()
                logger.info("Successfully added theme_preference column")
            else:
                logger.debug("theme_preference column already exists")
    except Exception as e:
        logger.error(f"Error ensuring theme_preference column: {e}")
        # Don't raise - allow app to start even if migration fails
        # The error will be caught when trying to use the column


async def ensure_avatar_column() -> None:
    """
    Ensure avatar column exists in users table.
    This is a temporary fix until proper migrations are run.
    """
    try:
        async with engine.begin() as conn:
            # Check if column exists
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'avatar'
            """))
            
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                logger.info("Adding missing avatar column to users table...")
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN avatar VARCHAR(500) NULL
                """))
                await conn.commit()
                logger.info("Successfully added avatar column")
            else:
                logger.debug("avatar column already exists")
    except Exception as e:
        logger.error(f"Error ensuring avatar column: {e}", exc_info=True)
        # Don't raise - allow app to start even if migration fails
        # The error will be caught when trying to use the column
