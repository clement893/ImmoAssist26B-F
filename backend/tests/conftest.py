"""
Pytest configuration and fixtures for backend tests.

Provides:
- Database fixtures
- Test client
- User fixtures
- Authentication helpers
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.core.auth import get_password_hash, create_access_token
from datetime import timedelta


# Test database URL (use in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db() -> Generator[AsyncSession, None, None]:
    """Create a test database session"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client(db: AsyncSession) -> Generator[TestClient, None, None]:
    """Create a test client"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user"""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create an admin test user"""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword123"),
        first_name="Admin",
        last_name="User",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Add admin role (would need Role and UserRole setup)
    # For now, just add access token for convenience
    token = create_access_token({"sub": user.email})
    user.access_token = token
    return user


@pytest.fixture
async def authenticated_user(db: AsyncSession) -> User:
    """Create an authenticated test user with token"""
    user = User(
        email="auth@example.com",
        hashed_password=get_password_hash("authpassword123"),
        first_name="Auth",
        last_name="User",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Add access token for convenience
    token = create_access_token({"sub": user.email})
    user.access_token = token
    return user
