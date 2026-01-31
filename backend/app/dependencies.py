"""
Dependencies for FastAPI endpoints
Provides authentication and authorization dependencies
"""

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.role import Role, UserRole
from app.api.v1.endpoints.auth import get_current_user as auth_get_current_user
from app.services.subscription_service import SubscriptionService
from app.services.stripe_service import StripeService
from app.core.tenancy import (
    TenancyConfig,
    get_current_tenant,
    set_current_tenant,
    get_user_tenant_id,
)


def get_current_user(
    current_user: Annotated[User, Depends(auth_get_current_user)]
) -> User:
    """Get current authenticated user"""
    return current_user


async def is_superadmin(
    user: User,
    db: AsyncSession
) -> bool:
    """
    Check if a user has the superadmin role.
    Returns True if user has superadmin role, False otherwise.
    
    Args:
        user: User object to check
        db: Database session
    
    Returns:
        True if user is superadmin, False otherwise
    """
    result = await db.execute(
        select(UserRole)
        .join(Role)
        .where(
            UserRole.user_id == user.id,
            Role.slug == "superadmin",
            Role.is_active == True
        )
    )
    user_role = result.scalar_one_or_none()
    return user_role is not None


async def is_admin(
    user: User,
    db: AsyncSession
) -> bool:
    """
    Check if a user has the admin role (not superadmin).
    Returns True if user has admin role, False otherwise.
    
    Note: Superadmins are automatically considered admins,
    but this function specifically checks for the "admin" role.
    
    Args:
        user: User object to check
        db: Database session
    
    Returns:
        True if user has admin role, False otherwise
    """
    result = await db.execute(
        select(UserRole)
        .join(Role)
        .where(
            UserRole.user_id == user.id,
            Role.slug == "admin",
            Role.is_active == True
        )
    )
    admin_role = result.scalar_one_or_none()
    return admin_role is not None


async def is_admin_or_superadmin(
    user: User,
    db: AsyncSession
) -> bool:
    """
    Check if a user has admin OR superadmin role.
    Superadmins are automatically considered admins.
    
    Args:
        user: User object to check
        db: Database session
    
    Returns:
        True if user is admin or superadmin, False otherwise
    """
    # Check superadmin first (superadmins are automatically admins)
    if await is_superadmin(user, db):
        return True
    
    # Check admin role
    return await is_admin(user, db)


async def require_superadmin(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> None:
    """
    Dependency to require superadmin role.
    Raises HTTPException if user is not a superadmin.
    """
    is_super = await is_superadmin(current_user, db)
    
    if not is_super:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    
    return None


async def require_admin_or_superadmin(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> None:
    """
    Dependency to require admin OR superadmin role.
    Superadmins are automatically considered admins.
    Raises HTTPException if user is neither admin nor superadmin.
    """
    if not await is_admin_or_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or superadmin access required"
        )
    return None


# Note: For optional user authentication, use Optional[User] = Depends(get_current_user)
# directly in endpoint signatures. FastAPI will handle the optional dependency.
# Example:
#   async def endpoint(current_user: Optional[User] = Depends(get_current_user)):
#       if current_user:
#           # User is authenticated
#       else:
#           # User is anonymous


# ============================================================================
# Service Dependencies
# ============================================================================

async def get_subscription_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubscriptionService:
    """Dependency to get SubscriptionService instance"""
    return SubscriptionService(db)


def get_stripe_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> StripeService:
    """Dependency to get StripeService instance"""
    return StripeService(db)


# ============================================================================
# Tenancy Dependencies
# ============================================================================

async def get_tenant_scope(
    current_user: Optional[User] = Depends(get_current_user),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> Optional[int]:
    """
    Get tenant scope for the current request.
    
    This dependency:
    1. Checks if tenant is already set (from middleware/header)
    2. If not, gets tenant from authenticated user's primary team
    3. Sets tenant in context for query scoping
    
    Returns:
        Tenant ID, or None if tenancy disabled or no tenant found
    
    Usage:
        @router.get("/items")
        async def get_items(
            tenant_id: Optional[int] = Depends(get_tenant_scope),
            db: AsyncSession = Depends(get_db)
        ):
            # tenant_id is automatically set in context
            # Queries will be scoped to this tenant
    """
    # If tenancy is disabled, return None
    if TenancyConfig.is_single_mode():
        return None
    
    # Check if tenant is already set (from middleware/header)
    tenant_id = get_current_tenant()
    if tenant_id is not None:
        return tenant_id
    
    # If user is authenticated, get their primary team
    if current_user:
        tenant_id = await get_user_tenant_id(current_user.id, db)
        if tenant_id is not None:
            set_current_tenant(tenant_id)
            return tenant_id
    
    # No tenant found - this is OK for some endpoints
    # (e.g., public endpoints, admin endpoints)
    return None


async def require_tenant(
    tenant_id: Optional[int] = Depends(get_tenant_scope),
) -> int:
    """
    Dependency that requires a tenant to be set.
    
    Raises HTTPException if no tenant is found.
    
    Usage:
        @router.get("/items")
        async def get_items(
            tenant_id: int = Depends(require_tenant),
            db: AsyncSession = Depends(get_db)
        ):
            # tenant_id is guaranteed to be set
    """
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required. Provide X-Tenant-ID header or authenticate with a user that has a team."
        )
    return tenant_id


