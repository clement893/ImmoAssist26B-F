"""Database connection and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.resolved_database_url,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,   # ✅ Évite les erreurs de détachement après commit
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    """
    Dependency FastAPI.
    On n'auto-commit PAS ici — chaque service gère son propre commit.
    Rollback uniquement en cas d'exception non gérée.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables and demo user if needed."""
    from app.db import models  # noqa: F401
    from sqlalchemy import select, text

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migration: add transaction_id, promesse_achat_id to lea_conversations if missing
        for col in ("transaction_id", "promesse_achat_id"):
            try:
                await conn.execute(text(
                    f"ALTER TABLE lea_conversations ADD COLUMN {col} INTEGER"
                ))
            except Exception:
                pass  # Column likely exists
        # Migration: delai_acceptation DATE → VARCHAR (accepte "24 heures")
        try:
            await conn.execute(text(
                "ALTER TABLE promesses_achat ALTER COLUMN delai_acceptation TYPE VARCHAR(100) USING delai_acceptation::text"
            ))
        except Exception:
            pass

    async with AsyncSessionLocal() as session:
        from app.db.models import User
        try:
            result = await session.execute(select(User).where(User.id == 1))
            if result.scalar_one_or_none() is None:
                user = User(id=1, full_name="Courtier Demo", permis_number="12345")
                session.add(user)
                await session.commit()
        except Exception:
            await session.rollback()
