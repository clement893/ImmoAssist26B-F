"""
RBAC Dependencies
Dependencies for checking permissions and roles
"""

from typing import List, Optional
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.rbac_service import RBACService
from app.core.security_audit import SecurityAuditLogger, SecurityEventType


async def require_permission(
    permission: str,
    current_user: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> User:
    """Dependency to require a specific permission"""
    rbac_service = RBACService(db)
    has_permission = await rbac_service.has_permission(current_user.id, permission)
    
    if not has_permission:
        # Log permission denied event
        try:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.PERMISSION_DENIED,
                description=f"Permission denied: {permission}",
                user_id=current_user.id,
                user_email=current_user.email,
                ip_address=request.client.host if request and request.client else None,
                user_agent=request.headers.get("user-agent") if request else None,
                request_method=request.method if request else None,
                request_path=str(request.url.path) if request else None,
                severity="warning",
                success="failure",
                metadata={"permission": permission}
            )
        except Exception:
            pass  # Don't fail request if audit logging fails
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required: {permission}",
        )
    
    return current_user


async def require_any_permission(
    permissions: List[str],
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require any of the specified permissions"""
    rbac_service = RBACService(db)
    has_permission = await rbac_service.has_any_permission(current_user.id, permissions)
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of these permissions required: {', '.join(permissions)}",
        )
    
    return current_user


async def require_all_permissions(
    permissions: List[str],
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require all of the specified permissions"""
    rbac_service = RBACService(db)
    has_permission = await rbac_service.has_all_permissions(current_user.id, permissions)
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"All of these permissions required: {', '.join(permissions)}",
        )
    
    return current_user


async def require_role(
    role_slug: str,
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require a specific role"""
    rbac_service = RBACService(db)
    has_role = await rbac_service.has_role(current_user.id, role_slug)
    
    if not has_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role required: {role_slug}",
        )
    
    return current_user


async def require_any_role(
    role_slugs: List[str],
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require any of the specified roles"""
    rbac_service = RBACService(db)
    has_role = await rbac_service.has_any_role(current_user.id, role_slugs)
    
    if not has_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"One of these roles required: {', '.join(role_slugs)}",
        )
    
    return current_user


async def require_team_permission(
    team_id: int,
    permission: str,
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require a permission in a specific team"""
    rbac_service = RBACService(db)
    has_permission = await rbac_service.has_team_permission(current_user.id, team_id, permission)
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission required in team: {permission}",
        )
    
    return current_user


async def require_team_owner(
    team_id: int,
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require team ownership"""
    from app.services.team_service import TeamService
    
    team_service = TeamService(db)
    is_owner = await team_service.is_team_owner(current_user.id, team_id)
    
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Team ownership required",
        )
    
    return current_user


async def require_team_member(
    team_id: int,
    current_user: User,
    db: AsyncSession,
) -> User:
    """Dependency to require team membership"""
    from app.services.team_service import TeamService
    
    team_service = TeamService(db)
    is_member = await team_service.is_team_member(current_user.id, team_id)
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Team membership required",
        )
    
    return current_user

