"""
RBAC Endpoints
API endpoints for role-based access control
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies import get_current_user
from app.dependencies.rbac import require_permission, require_role
from app.models import User, UserPermission, Role, Permission
from app.core.logging import logger
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.schemas.rbac import (
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    PermissionCreate,
    PermissionResponse,
    RolePermissionAssign,
    UserRoleAssign,
    UserRoleResponse,
    PermissionCheckRequest,
    PermissionCheckResponse,
    RoleListResponse,
    UserPermissionCreate,
    UserPermissionResponse,
    BulkRoleUpdate,
    BulkPermissionUpdate,
)
from app.services.rbac_service import RBACService

router = APIRouter(prefix="/rbac", tags=["rbac"])


@router.get("/roles", response_model=RoleListResponse)
async def list_roles(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all roles (requires admin permission)"""
    await require_permission("roles:read", current_user, db, request)
    
    rbac_service = RBACService(db)
    from app.models import Role
    from sqlalchemy import select, func as sql_func
    
    # Get total count
    count_result = await db.execute(select(sql_func.count(Role.id)))
    total = count_result.scalar()
    
    # Get roles
    result = await db.execute(
        select(Role)
        .offset(skip)
        .limit(limit)
        .order_by(Role.name)
    )
    roles = result.scalars().all()
    
    # Load permissions for each role
    roles_with_permissions = []
    for role in roles:
        permissions = await rbac_service.get_role_permissions(role.id)
        role_dict = {
            "id": role.id,
            "name": role.name,
            "slug": role.slug,
            "description": role.description,
            "is_system": role.is_system,
            "is_active": role.is_active,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "permissions": [PermissionResponse.model_validate(p) for p in permissions],
        }
        roles_with_permissions.append(RoleResponse.model_validate(role_dict))
    
    return RoleListResponse(roles=roles_with_permissions, total=total)


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: Request,
    role_data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new role (requires admin permission)"""
    await require_permission("roles:create", current_user, db, request)
    
    rbac_service = RBACService(db)
    role = await rbac_service.create_role(
        name=role_data.name,
        slug=role_data.slug,
        description=role_data.description,
        is_system=role_data.is_system,
    )
    
    return RoleResponse.model_validate(role)


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    request: Request,
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a role by ID"""
    await require_permission("roles:read", current_user, db, request)
    
    from app.models import Role
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    rbac_service = RBACService(db)
    permissions = await rbac_service.get_role_permissions(role_id)
    role_dict = {
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "is_system": role.is_system,
        "is_active": role.is_active,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": [PermissionResponse.model_validate(p) for p in permissions],
    }
    
    return RoleResponse.model_validate(role_dict)


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    request: Request,
    role_id: int,
    role_data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a role (requires admin permission)"""
    await require_permission("roles:update", current_user, db, request)
    
    from app.models import Role
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    if role.is_system and role_data.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify system role name",
        )
    
    if role_data.name:
        role.name = role_data.name
    if role_data.description is not None:
        role.description = role_data.description
    if role_data.is_active is not None:
        role.is_active = role_data.is_active
    
    await db.commit()
    await db.refresh(role)
    
    rbac_service = RBACService(db)
    permissions = await rbac_service.get_role_permissions(role_id)
    role_dict = {
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "is_system": role.is_system,
        "is_active": role.is_active,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": [PermissionResponse.model_validate(p) for p in permissions],
    }
    
    return RoleResponse.model_validate(role_dict)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    request: Request,
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a role (requires admin permission)"""
    await require_permission("roles:delete", current_user, db, request)
    
    from app.models import Role
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system role",
        )
    
    # Check if role is assigned to any users
    from app.models import UserRole
    users_with_role = await db.execute(
        select(UserRole).where(UserRole.role_id == role_id)
    )
    if users_with_role.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete role that is assigned to users. Remove role from users first.",
        )
    
    role.is_active = False
    await db.commit()
    
    return None


@router.post("/roles/{role_id}/permissions", response_model=RoleResponse)
async def assign_permission_to_role(
    request: Request,
    role_id: int,
    permission_data: RolePermissionAssign,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign a permission to a role"""
    await require_permission("roles:update", current_user, db, request)
    
    rbac_service = RBACService(db)
    await rbac_service.assign_permission_to_role(role_id, permission_data.permission_id)
    
    from app.models import Role
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    permissions = await rbac_service.get_role_permissions(role_id)
    role_dict = {
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "is_system": role.is_system,
        "is_active": role.is_active,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": [PermissionResponse.model_validate(p) for p in permissions],
    }
    
    return RoleResponse.model_validate(role_dict)


@router.delete("/roles/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_permission_from_role(
    request: Request,
    role_id: int,
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a permission from a role"""
    await require_permission("roles:update", current_user, db, request)
    
    rbac_service = RBACService(db)
    await rbac_service.remove_permission_from_role(role_id, permission_id)
    
    return None


@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all permissions"""
    await require_permission("permissions:read", current_user, db, request)
    
    from app.models import Permission
    
    result = await db.execute(select(Permission).order_by(Permission.resource, Permission.action))
    permissions = result.scalars().all()
    
    return [PermissionResponse.model_validate(p) for p in permissions]


@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    request: Request,
    permission_data: PermissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new permission"""
    await require_permission("permissions:create", current_user, db, request)
    
    rbac_service = RBACService(db)
    permission = await rbac_service.create_permission(
        resource=permission_data.resource,
        action=permission_data.action,
        description=permission_data.description,
    )
    
    return PermissionResponse.model_validate(permission)


@router.post("/users/{user_id}/roles", response_model=UserRoleResponse)
async def assign_role_to_user(
    request: Request,
    user_id: int,
    role_data: UserRoleAssign,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign a role to a user"""
    await require_permission("users:update", current_user, db, request)
    
    rbac_service = RBACService(db)
    user_role = await rbac_service.assign_role(user_id, role_data.role_id)
    
    from app.models import UserRole, Role
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(UserRole)
        .where(UserRole.id == user_role.id)
        .options(selectinload(UserRole.role))
    )
    user_role_with_role = result.scalar_one_or_none()
    
    if not user_role_with_role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User role not found")
    
    # Get role name for logging
    role_result = await db.execute(select(Role).where(Role.id == role_data.role_id))
    role = role_result.scalar_one_or_none()
    role_name = role.name if role else f"role_id_{role_data.role_id}"
    
    # Get target user email for logging
    from app.models.user import User as UserModel
    target_user_result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    target_user = target_user_result.scalar_one_or_none()
    
    # Log role changed event
    from app.core.security_audit import SecurityAuditLogger, SecurityEventType
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ROLE_CHANGED,
            description=f"Role '{role_name}' assigned to user {target_user.email if target_user else user_id}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={
                "target_user_id": user_id,
                "target_user_email": target_user.email if target_user else None,
                "role_id": role_data.role_id,
                "role_name": role_name,
                "action": "assigned"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log role changed event: {e}")
    
    return UserRoleResponse.model_validate(user_role_with_role)


@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    request: Request,
    user_id: int,
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a role from a user"""
    await require_permission("users:update", current_user, db, request)
    
    # Get role and user info before removal for logging
    from app.models import Role
    from app.models.user import User as UserModel
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalar_one_or_none()
    role_name = role.name if role else f"role_id_{role_id}"
    
    target_user_result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    target_user = target_user_result.scalar_one_or_none()
    
    # Prevent removing superadmin role if it's the last superadmin
    if role and role.slug == "superadmin":
        # Count how many users have superadmin role
        from app.models import UserRole
        superadmin_users = await db.execute(
            select(UserRole)
            .join(Role)
            .where(Role.slug == "superadmin")
            .where(Role.is_active == True)
        )
        superadmin_count = len(list(superadmin_users.scalars().all()))
        
        if superadmin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove superadmin role from the last superadmin user",
            )
    
    rbac_service = RBACService(db)
    await rbac_service.remove_role(user_id, role_id)
    
    # Log role changed event
    from app.core.security_audit import SecurityAuditLogger, SecurityEventType
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ROLE_CHANGED,
            description=f"Role '{role_name}' removed from user {target_user.email if target_user else user_id}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={
                "target_user_id": user_id,
                "target_user_email": target_user.email if target_user else None,
                "role_id": role_id,
                "role_name": role_name,
                "action": "removed"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log role changed event: {e}")
    
    return None


@router.get("/users/{user_id}/roles", response_model=List[RoleResponse])
async def get_user_roles(
    request: Request,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all roles for a user"""
    # Users can view their own roles, admins can view anyone's
    if user_id != current_user.id:
        await require_permission("users:read", current_user, db, request)
    
    rbac_service = RBACService(db)
    roles = await rbac_service.get_user_roles(user_id)
    
    roles_with_permissions = []
    for role in roles:
        permissions = await rbac_service.get_role_permissions(role.id)
        role_dict = {
            "id": role.id,
            "name": role.name,
            "slug": role.slug,
            "description": role.description,
            "is_system": role.is_system,
            "is_active": role.is_active,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "permissions": [PermissionResponse.model_validate(p) for p in permissions],
        }
        roles_with_permissions.append(RoleResponse.model_validate(role_dict))
    
    return roles_with_permissions


@router.get("/users/{user_id}/permissions", response_model=List[str])
async def get_user_permissions(
    request: Request,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all permissions for a user (from roles + custom permissions).
    
    This endpoint now includes custom permissions in addition to role-based permissions.
    """
    # Users can view their own permissions, admins can view anyone's
    if user_id != current_user.id:
        await require_permission("users:read", current_user, db, request)
    
    rbac_service = RBACService(db)
    permissions = await rbac_service.get_user_permissions(user_id)
    
    return sorted(list(permissions))


@router.post("/check", response_model=PermissionCheckResponse)
async def check_permission(
    check_data: PermissionCheckRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if current user has a permission"""
    rbac_service = RBACService(db)
    has_permission = await rbac_service.has_permission(current_user.id, check_data.permission)
    roles = await rbac_service.get_user_roles(current_user.id)
    
    return PermissionCheckResponse(
        has_permission=has_permission,
        user_id=current_user.id,
        permission=check_data.permission,
        roles=[role.slug for role in roles],
    )


# Custom permissions endpoints
@router.post("/users/{user_id}/permissions/custom", response_model=UserPermissionResponse, status_code=status.HTTP_201_CREATED)
async def add_custom_permission(
    request: Request,
    user_id: int,
    permission_data: UserPermissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a custom permission to a user (requires admin permission)"""
    await require_permission("users:update", current_user, db, request)
    
    rbac_service = RBACService(db)
    user_permission = await rbac_service.add_custom_permission(user_id, permission_data.permission_id)
    
    # Load permission for response
    from app.models import Permission
    result = await db.execute(
        select(UserPermission)
        .where(UserPermission.id == user_permission.id)
        .options(selectinload(UserPermission.permission))
    )
    user_permission_with_perm = result.scalar_one_or_none()
    
    if not user_permission_with_perm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User permission not found")
    
    # Log permission changed event
    from app.models.user import User as UserModel
    target_user_result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    target_user = target_user_result.scalar_one_or_none()
    
    perm_result = await db.execute(select(Permission).where(Permission.id == permission_data.permission_id))
    permission = perm_result.scalar_one_or_none()
    perm_name = permission.name if permission else f"permission_id_{permission_data.permission_id}"
    
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ROLE_CHANGED,  # Using ROLE_CHANGED for permission changes
            description=f"Custom permission '{perm_name}' added to user {target_user.email if target_user else user_id}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={
                "target_user_id": user_id,
                "target_user_email": target_user.email if target_user else None,
                "permission_id": permission_data.permission_id,
                "permission_name": perm_name,
                "action": "custom_permission_added"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log custom permission added event: {e}")
    
    return UserPermissionResponse.model_validate(user_permission_with_perm)


@router.delete("/users/{user_id}/permissions/custom/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_custom_permission(
    request: Request,
    user_id: int,
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a custom permission from a user (requires admin permission)"""
    await require_permission("users:update", current_user, db, request)
    
    # Get user and permission info before removal for logging
    from app.models.user import User as UserModel
    from app.models import Permission
    target_user_result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    target_user = target_user_result.scalar_one_or_none()
    
    perm_result = await db.execute(select(Permission).where(Permission.id == permission_id))
    permission = perm_result.scalar_one_or_none()
    perm_name = permission.name if permission else f"permission_id_{permission_id}"
    
    rbac_service = RBACService(db)
    removed = await rbac_service.remove_custom_permission(user_id, permission_id)
    
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom permission not found")
    
    # Log permission changed event
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ROLE_CHANGED,
            description=f"Custom permission '{perm_name}' removed from user {target_user.email if target_user else user_id}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={
                "target_user_id": user_id,
                "target_user_email": target_user.email if target_user else None,
                "permission_id": permission_id,
                "permission_name": perm_name,
                "action": "custom_permission_removed"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log custom permission removed event: {e}")
    
    return None


@router.get("/users/{user_id}/permissions/custom", response_model=List[UserPermissionResponse])
async def get_user_custom_permissions(
    request: Request,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all custom permissions for a user"""
    # Users can view their own permissions, admins can view anyone's
    if user_id != current_user.id:
        await require_permission("users:read", current_user, db, request)
    
    rbac_service = RBACService(db)
    custom_permissions = await rbac_service.get_user_custom_permissions(user_id)
    
    # Convert to response format
    result = await db.execute(
        select(UserPermission)
        .where(UserPermission.user_id == user_id)
        .options(selectinload(UserPermission.permission))
    )
    user_permissions = result.scalars().all()
    
    return [UserPermissionResponse.model_validate(up) for up in user_permissions]


# Bulk operations endpoints
@router.put("/users/{user_id}/roles", response_model=List[RoleResponse])
async def update_user_roles(
    request: Request,
    user_id: int,
    role_data: BulkRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update all roles for a user (bulk operation - replaces all existing roles)"""
    await require_permission("users:update", current_user, db, request)
    
    # Validate that we're not removing the last superadmin
    from app.models import UserRole
    # Check current superadmin users
    current_superadmin_users = await db.execute(
        select(UserRole)
        .join(Role)
        .where(Role.slug == "superadmin")
        .where(Role.is_active == True)
    )
    current_superadmin_user_ids = {ur.user_id for ur in current_superadmin_users.scalars().all()}
    
    # Check if target user is currently a superadmin
    target_is_superadmin = user_id in current_superadmin_user_ids
    
    # Check if new roles include superadmin
    new_role_result = await db.execute(
        select(Role).where(Role.id.in_(role_data.role_ids))
    )
    new_roles = list(new_role_result.scalars().all())
    new_has_superadmin = any(role.slug == "superadmin" for role in new_roles)
    
    # If removing superadmin from the last superadmin, prevent it
    if target_is_superadmin and not new_has_superadmin and len(current_superadmin_user_ids) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove superadmin role from the last superadmin user",
        )
    
    rbac_service = RBACService(db)
    user_roles = await rbac_service.update_user_roles(user_id, role_data.role_ids)
    
    # Get role details for response
    roles_with_permissions = []
    for user_role in user_roles:
        permissions = await rbac_service.get_role_permissions(user_role.role_id)
        role_result = await db.execute(select(Role).where(Role.id == user_role.role_id))
        role = role_result.scalar_one_or_none()
        
        if role:
            role_dict = {
                "id": role.id,
                "name": role.name,
                "slug": role.slug,
                "description": role.description,
                "is_system": role.is_system,
                "is_active": role.is_active,
                "created_at": role.created_at,
                "updated_at": role.updated_at,
                "permissions": [PermissionResponse.model_validate(p) for p in permissions],
            }
            roles_with_permissions.append(RoleResponse.model_validate(role_dict))
    
    # Log role changed event
    from app.models.user import User as UserModel
    target_user_result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    target_user = target_user_result.scalar_one_or_none()
    
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.ROLE_CHANGED,
            description=f"Roles updated for user {target_user.email if target_user else user_id}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={
                "target_user_id": user_id,
                "target_user_email": target_user.email if target_user else None,
                "role_ids": role_data.role_ids,
                "action": "bulk_update"
            }
        )
    except Exception as e:
        logger.warning(f"Failed to log bulk role update event: {e}")
    
    return roles_with_permissions


@router.put("/roles/{role_id}/permissions", response_model=RoleResponse)
async def update_role_permissions(
    request: Request,
    role_id: int,
    permission_data: BulkPermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update all permissions for a role (bulk operation - replaces all existing permissions)"""
    await require_permission("roles:update", current_user, db, request)
    
    from app.models import Role
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify permissions for system role",
        )
    
    # Validate that all permissions exist
    invalid_permission_ids = []
    for perm_id in permission_data.permission_ids:
        perm_result = await db.execute(select(Permission).where(Permission.id == perm_id))
        if not perm_result.scalar_one_or_none():
            invalid_permission_ids.append(perm_id)
    
    if invalid_permission_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission IDs: {invalid_permission_ids}",
        )
    
    rbac_service = RBACService(db)
    await rbac_service.update_role_permissions(role_id, permission_data.permission_ids)
    
    # Get updated role with permissions
    permissions = await rbac_service.get_role_permissions(role_id)
    role_dict = {
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "is_system": role.is_system,
        "is_active": role.is_active,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": [PermissionResponse.model_validate(p) for p in permissions],
    }
    
    return RoleResponse.model_validate(role_dict)

