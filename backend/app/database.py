"""Database - re-exports from core for compatibility."""
from app.core.database import (
    Base,
    engine,
    AsyncSessionLocal,
    get_db,
    init_db,
    close_db,
)

__all__ = ["Base", "engine", "AsyncSessionLocal", "get_db", "init_db", "close_db"]
