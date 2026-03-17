"""
Database Configuration
SQLAlchemy async setup with connection pooling
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings

_db_url = str(settings.DATABASE_URL)
_is_sqlite = "sqlite" in _db_url.lower()

# Engine config: SQLite has different connect_args than PostgreSQL
_engine_kw: dict = {
    "echo": settings.DEBUG,
    "future": True,
    "pool_pre_ping": True,
}
if _is_sqlite:
    _engine_kw["connect_args"] = {"check_same_thread": False}
    _engine_kw["pool_size"] = 1
    _engine_kw["max_overflow"] = 0
else:
    _engine_kw.update(
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_recycle=3600,
        pool_reset_on_return="commit",
        pool_timeout=30,
        connect_args={
            "server_settings": {
                "application_name": "modele_backend",
                "jit": "off",
            },
            "command_timeout": 60,
        },
        execution_options={
            "autocommit": False,
            "isolation_level": "READ COMMITTED",
        },
    )

engine = create_async_engine(_db_url, **_engine_kw)

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


