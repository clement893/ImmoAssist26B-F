"""
Tenant Database Manager

Manages separate databases for tenants in separate_db mode.
This module handles:
- Creating new tenant databases
- Getting database connections for tenants
- Managing tenant database registry
"""

from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError, SQLAlchemyError
import os

from app.core.tenancy import TenancyConfig
from app.core.config import settings
from app.core.logging import logger


class TenantDatabaseManager:
    """
    Manager for tenant databases in separate_db mode.
    
    This class handles creating and managing separate databases for each tenant.
    Only active when TENANCY_MODE=separate_db.
    """
    
    _engines: Dict[int, any] = {}
    _sessions: Dict[int, async_sessionmaker] = {}
    
    @classmethod
    def is_enabled(cls) -> bool:
        """Check if separate database mode is enabled"""
        return TenancyConfig.is_separate_db_mode()
    
    @classmethod
    def get_registry_db_url(cls) -> str:
        """Get database URL for tenant registry"""
        registry_url = settings.TENANT_DB_REGISTRY_URL
        if not registry_url:
            raise ValueError(
                "TENANT_DB_REGISTRY_URL must be set when TENANCY_MODE=separate_db"
            )
        return str(registry_url)
    
    @classmethod
    def get_base_db_url(cls) -> str:
        """Get base database URL for tenant databases"""
        base_url = settings.TENANT_DB_BASE_URL
        if not base_url:
            raise ValueError(
                "TENANT_DB_BASE_URL must be set when TENANCY_MODE=separate_db"
            )
        return str(base_url)
    
    @classmethod
    def get_tenant_db_name(cls, tenant_id: int) -> str:
        """Get database name for a tenant"""
        return f"tenant_{tenant_id}_db"
    
    @classmethod
    def get_tenant_db_url(cls, tenant_id: int) -> str:
        """Get database URL for a tenant"""
        base_url = cls.get_base_db_url()
        db_name = cls.get_tenant_db_name(tenant_id)
        
        # Parse base URL and replace database name
        # Format: postgresql+asyncpg://user:pass@host:port/dbname
        if "/" in base_url:
            parts = base_url.rsplit("/", 1)
            base_without_db = parts[0]
            return f"{base_without_db}/{db_name}"
        else:
            return f"{base_url}/{db_name}"
    
    @classmethod
    async def create_tenant_database(cls, tenant_id: int) -> bool:
        """
        Create a new database for a tenant.
        
        Args:
            tenant_id: Tenant/team ID
        
        Returns:
            True if database was created, False if it already exists
        
        Raises:
            ValueError: If separate_db mode is not enabled
            Exception: If database creation fails
        """
        if not cls.is_enabled():
            raise ValueError("Tenant database creation only available in separate_db mode")
        
        db_name = cls.get_tenant_db_name(tenant_id)
        base_url = cls.get_base_db_url()
        
        # Parse base URL to get connection without database name
        # Connect to 'postgres' database to create new database
        if "/" in base_url:
            parts = base_url.rsplit("/", 1)
            admin_url = f"{parts[0]}/postgres"
        else:
            admin_url = f"{base_url}/postgres"
        
        try:
            # Create async engine for admin connection
            admin_engine = create_async_engine(
                admin_url,
                echo=False,
                isolation_level="AUTOCOMMIT"
            )
            
            async with admin_engine.connect() as conn:
                # Check if database already exists
                result = await conn.execute(
                    text(
                        "SELECT 1 FROM pg_database WHERE datname = :db_name"
                    ).bindparams(db_name=db_name)
                )
                exists = result.scalar_one_or_none() is not None
                
                if exists:
                    logger.info(f"Tenant database {db_name} already exists")
                    return False
                
                # Create database
                await conn.execute(
                    text(f'CREATE DATABASE "{db_name}"')
                )
                logger.info(f"Created tenant database: {db_name}")
            
            await admin_engine.dispose()
            
            # Run migrations on new database
            await cls.run_migrations(tenant_id)
            
            return True
            
        except OperationalError as e:
            logger.error(f"Database operational error creating tenant database {db_name}: {e}", exc_info=True)
            raise ValueError(f"Failed to connect to database: {str(e)}") from e
        except ProgrammingError as e:
            logger.error(f"Database programming error creating tenant database {db_name}: {e}", exc_info=True)
            raise ValueError(f"Database SQL error: {str(e)}") from e
        except SQLAlchemyError as e:
            logger.error(f"SQLAlchemy error creating tenant database {db_name}: {e}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating tenant database {db_name}: {e}", exc_info=True)
            raise
    
    @classmethod
    async def run_migrations(cls, tenant_id: int) -> None:
        """
        Run database migrations on a tenant database.
        
        Args:
            tenant_id: Tenant/team ID
        """
        if not cls.is_enabled():
            return
        
        db_url = cls.get_tenant_db_url(tenant_id)
        
        try:
            # Import alembic here to avoid circular imports
            from alembic.config import Config
            from alembic import command
            
            # Create alembic config
            alembic_cfg = Config("alembic.ini")
            alembic_cfg.set_main_option("sqlalchemy.url", db_url)
            
            # Run migrations
            command.upgrade(alembic_cfg, "head")
            logger.info(f"Ran migrations on tenant database: {cls.get_tenant_db_name(tenant_id)}")
            
        except OperationalError as e:
            logger.error(f"Database operational error running migrations on tenant database: {e}", exc_info=True)
            raise ValueError(f"Failed to connect to database for migrations: {str(e)}") from e
        except ProgrammingError as e:
            logger.error(f"Database programming error running migrations on tenant database: {e}", exc_info=True)
            raise ValueError(f"Migration SQL error: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error running migrations on tenant database: {e}", exc_info=True)
            raise
    
    @classmethod
    def get_tenant_engine(cls, tenant_id: int):
        """
        Get or create SQLAlchemy engine for a tenant database.
        
        Args:
            tenant_id: Tenant/team ID
        
        Returns:
            SQLAlchemy async engine
        """
        if not cls.is_enabled():
            raise ValueError("Tenant engines only available in separate_db mode")
        
        if tenant_id not in cls._engines:
            db_url = cls.get_tenant_db_url(tenant_id)
            cls._engines[tenant_id] = create_async_engine(
                db_url,
                echo=settings.DEBUG,
                future=True,
                pool_pre_ping=True,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
            )
            logger.debug(f"Created engine for tenant {tenant_id}")
        
        return cls._engines[tenant_id]
    
    @classmethod
    def get_tenant_session_factory(cls, tenant_id: int) -> async_sessionmaker:
        """
        Get or create session factory for a tenant database.
        
        Args:
            tenant_id: Tenant/team ID
        
        Returns:
            AsyncSessionLocal factory
        """
        if not cls.is_enabled():
            raise ValueError("Tenant sessions only available in separate_db mode")
        
        if tenant_id not in cls._sessions:
            engine = cls.get_tenant_engine(tenant_id)
            cls._sessions[tenant_id] = async_sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )
        
        return cls._sessions[tenant_id]
    
    @classmethod
    async def get_tenant_db(cls, tenant_id: int) -> AsyncSession:
        """
        Get database session for a tenant.
        
        This is a generator function compatible with FastAPI Depends.
        
        Args:
            tenant_id: Tenant/team ID
        
        Yields:
            AsyncSession for tenant database
        """
        if not cls.is_enabled():
            raise ValueError("Tenant databases only available in separate_db mode")
        
        session_factory = cls.get_tenant_session_factory(tenant_id)
        async with session_factory() as session:
            try:
                yield session
            finally:
                await session.close()
    
    @classmethod
    async def delete_tenant_database(cls, tenant_id: int) -> bool:
        """
        Delete a tenant database.
        
        WARNING: This is a destructive operation!
        
        Args:
            tenant_id: Tenant/team ID
        
        Returns:
            True if database was deleted, False if it didn't exist
        """
        if not cls.is_enabled():
            raise ValueError("Tenant database deletion only available in separate_db mode")
        
        db_name = cls.get_tenant_db_name(tenant_id)
        base_url = cls.get_base_db_url()
        
        # Parse base URL to get connection without database name
        if "/" in base_url:
            parts = base_url.rsplit("/", 1)
            admin_url = f"{parts[0]}/postgres"
        else:
            admin_url = f"{base_url}/postgres"
        
        try:
            # Close and remove engine/session if exists
            if tenant_id in cls._engines:
                await cls._engines[tenant_id].dispose()
                del cls._engines[tenant_id]
            if tenant_id in cls._sessions:
                del cls._sessions[tenant_id]
            
            # Create async engine for admin connection
            admin_engine = create_async_engine(
                admin_url,
                echo=False,
                isolation_level="AUTOCOMMIT"
            )
            
            async with admin_engine.connect() as conn:
                # Check if database exists
                result = await conn.execute(
                    text(
                        "SELECT 1 FROM pg_database WHERE datname = :db_name"
                    ).bindparams(db_name=db_name)
                )
                exists = result.scalar_one_or_none() is not None
                
                if not exists:
                    logger.info(f"Tenant database {db_name} does not exist")
                    return False
                
                # Terminate connections to database
                await conn.execute(
                    text(
                        f"""
                        SELECT pg_terminate_backend(pg_stat_activity.pid)
                        FROM pg_stat_activity
                        WHERE pg_stat_activity.datname = :db_name
                        AND pid <> pg_backend_pid()
                        """
                    ).bindparams(db_name=db_name)
                )
                
                # Drop database
                await conn.execute(
                    text(f'DROP DATABASE "{db_name}"')
                )
                logger.info(f"Deleted tenant database: {db_name}")
            
            await admin_engine.dispose()
            return True
            
        except OperationalError as e:
            logger.error(f"Database operational error deleting tenant database {db_name}: {e}", exc_info=True)
            raise ValueError(f"Failed to connect to database: {str(e)}") from e
        except ProgrammingError as e:
            logger.error(f"Database programming error deleting tenant database {db_name}: {e}", exc_info=True)
            raise ValueError(f"Database SQL error: {str(e)}") from e
        except SQLAlchemyError as e:
            logger.error(f"SQLAlchemy error deleting tenant database {db_name}: {e}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Unexpected error deleting tenant database {db_name}: {e}", exc_info=True)
            raise

