"""User service."""

from typing import Optional
from uuid import UUID
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError, DatabaseError

from app.core.security import hash_password, verify_password
from app.core.logging import logger
from app.models import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service for user operations."""

    def __init__(self, db: AsyncSession):
        """Initialize service."""
        self.db = db

    async def get_user_by_id(self, user_id: UUID | str) -> Optional[User]:
        """Get user by ID."""
        # Convert string to UUID if needed
        if isinstance(user_id, str):
            try:
                user_id = UUID(user_id)
            except ValueError:
                return None
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if user already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError(f"User with email {user_data.email} already exists")

        # Create user
        user = User(
            email=user_data.email,
            name=user_data.name,
            password_hash=hash_password(user_data.password),
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update_user(self, user_id: UUID, user_data: UserUpdate) -> Optional[User]:
        """Update user."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def delete_user(self, user_id: UUID) -> bool:
        """Delete user."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        self.db.delete(user)
        await self.db.commit()

        return True

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user."""
        user = await self.get_user_by_email(email)
        if not user:
            return None

        # OAuth users don't have password_hash
        if not user.password_hash:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    async def get_or_create_oauth_user(
        self,
        email: str,
        name: str,
        provider: str,
        provider_id: str,
    ) -> User:
        """Get or create OAuth user with retry logic for database connection issues."""
        max_retries = 3
        retry_delay = 0.5  # Start with 0.5 seconds
        
        for attempt in range(max_retries):
            try:
                # Check if user exists by email
                user = await self.get_user_by_email(email)
                
                if user:
                    # Update provider info if not set
                    if not user.provider:
                        user.provider = provider
                        user.provider_id = provider_id
                        user.is_verified = True  # OAuth users are verified
                        await self.db.commit()
                        await self.db.refresh(user)
                    return user
                
                # Create new OAuth user
                user = User(
                    email=email,
                    name=name,
                    password_hash=None,  # OAuth users don't have password
                    provider=provider,
                    provider_id=provider_id,
                    is_verified=True,  # OAuth users are verified
                )
                
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
                
                return user
                
            except (OperationalError, DatabaseError) as e:
                error_msg = str(e)
                is_last_attempt = attempt == max_retries - 1
                
                logger.warning(
                    f"Database error during OAuth user creation (attempt {attempt + 1}/{max_retries}): {error_msg}",
                    exc_info=True
                )
                
                if is_last_attempt:
                    # Log detailed error information for debugging
                    logger.error(
                        f"Failed to create/update OAuth user after {max_retries} attempts. "
                        f"Email: {email}, Provider: {provider}, Error: {error_msg}",
                        exc_info=True
                    )
                    # Re-raise the exception so it can be caught by the OAuth handler
                    raise
                
                # Wait before retrying with exponential backoff
                wait_time = retry_delay * (2 ** attempt)
                logger.info(f"Retrying OAuth user creation in {wait_time}s...")
                await asyncio.sleep(wait_time)
                
                # Try to refresh the session connection
                try:
                    await self.db.rollback()
                except Exception:
                    pass  # Ignore rollback errors

    async def list_users(self, skip: int = 0, limit: int = 10) -> list[User]:
        """List users."""
        result = await self.db.execute(
            select(User).offset(skip).limit(limit)
        )
        return result.scalars().all()
