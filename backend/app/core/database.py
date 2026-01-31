"""
Database Configuration
SQLAlchemy async setup with connection pooling
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Create async engine with optimized connection pooling
# Enhanced pool configuration for better performance
engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    future=True,
    # Connection pool optimization
    pool_pre_ping=True,  # Verify connections before use (prevents stale connections)
    pool_size=settings.DB_POOL_SIZE,  # Base pool size
    max_overflow=settings.DB_MAX_OVERFLOW,  # Maximum overflow connections
    pool_recycle=3600,  # Recycle connections after 1 hour (prevents stale connections)
    pool_reset_on_return='commit',  # Reset connection state on return to pool
    # Additional optimizations
    pool_timeout=30,  # Timeout for getting connection from pool (seconds)
    connect_args={
        "server_settings": {
            "application_name": "modele_backend",
            "jit": "off",  # Disable JIT for faster query planning on small queries
        },
        "command_timeout": 60,  # Query timeout (seconds)
    },
    # Query optimization
    execution_options={
        "autocommit": False,
        "isolation_level": "READ COMMITTED",  # Balance between consistency and performance
    },
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database (create tables)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections"""
    await engine.dispose()


