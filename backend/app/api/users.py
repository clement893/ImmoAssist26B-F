"""User endpoints."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from app.core.cache import cached

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user."""
    service = UserService(db)

    updated_user = await service.update_user(current_user.id, user_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return updated_user


@router.get("/{user_id}", response_model=UserResponse)
@cached(expire=300, key_prefix="user")
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get user by ID."""
    service = UserService(db)

    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.get("", response_model=List[UserResponse])
@cached(expire=300, key_prefix="users")
async def list_users(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
) -> List[UserResponse]:
    """List all users."""
    service = UserService(db)

    users = await service.list_users(skip=skip, limit=limit)
    return users


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete user."""
    # Only allow users to delete their own account or admins to delete any account
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account",
        )

    service = UserService(db)

    deleted = await service.delete_user(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
