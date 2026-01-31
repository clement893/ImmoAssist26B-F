#!/usr/bin/env python3
"""
Script to ensure avatar column migration is executed
This script can be run manually or called from entrypoint.sh
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.logging import logger


def check_avatar_column_exists():
    """Check if avatar column exists in users table"""
    try:
        # Convert async URL to sync URL for direct connection
        database_url = str(settings.DATABASE_URL)
        if "postgresql+asyncpg://" in database_url:
            database_url = database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        elif "postgresql://" in database_url and "+" not in database_url:
            database_url = database_url.replace("postgresql://", "postgresql+psycopg2://")
        
        engine = create_engine(database_url)
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'avatar'
            """))
            exists = result.fetchone() is not None
            return exists
    except Exception as e:
        logger.error(f"Error checking avatar column: {e}")
        return False


def run_migration():
    """Run Alembic migration to add avatar column"""
    try:
        alembic_cfg = Config(str(Path(__file__).parent.parent / "alembic.ini"))
        logger.info("Running Alembic migration to add avatar column...")
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Migration completed successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}", exc_info=True)
        return False


def main():
    """Main function"""
    logger.info("=" * 50)
    logger.info("Checking avatar column migration status...")
    logger.info("=" * 50)
    
    # Check if column already exists
    if check_avatar_column_exists():
        logger.info("✅ Avatar column already exists - migration not needed")
        return 0
    
    logger.info("⚠️  Avatar column does not exist - running migration...")
    
    # Run migration
    if run_migration():
        # Verify column was created
        if check_avatar_column_exists():
            logger.info("✅ Avatar column successfully created!")
            return 0
        else:
            logger.error("❌ Migration ran but column still doesn't exist")
            return 1
    else:
        logger.error("❌ Migration failed")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
