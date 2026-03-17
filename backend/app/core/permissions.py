"""
Granular Permission System

Provides resource-level permissions and fine-grained access control.
Supports:
- Resource-based permissions (e.g., "read:project:123")
- Action-based permissions (e.g., "create:project", "update:project")
- Role-based permissions (e.g., "admin", "user")
- Custom permission checks

NOTE: This module is being refactored to use RBACService (database-based) instead of hardcoded permissions.
The async functions use RBACService, while sync functions are kept for backward compatibility.

@example
```python
from app.core.permissions import require_permission, Permission

@router.get("/projects/{project_id}")
@require_permission("read:project")
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    # Check if user can read this specific project
    if not await has_resource_permission(current_user, "read:project", project_id, db):
        raise HTTPException(403, "Access denied")
    return project
```
"""

from typing import List, Optional, Callable, Any
from functools import wraps
from fastapi import HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.role import Role, UserRole
from app.core.database import get_db
from app.dependencies import get_current_user
from app.services.rbac_service import RBACService


class Permission:
    """Permission constants for common actions"""
    
    # User permissions
    READ_USER = "read:user"
    UPDATE_USER = "update:user"
    DELETE_USER = "delete:user"
    LIST_USERS = "list:users"
    
    # Project permissions
    CREATE_PROJECT = "create:project"
    READ_PROJECT = "read:project"
    UPDATE_PROJECT = "update:project"
    DELETE_PROJECT = "delete:project"
    LIST_PROJECTS = "list:projects"
    
    # Team permissions
    CREATE_TEAM = "create:team"
    READ_TEAM = "read:team"
    UPDATE_TEAM = "update:team"
    DELETE_TEAM = "delete:team"
    LIST_TEAMS = "list:teams"
    MANAGE_TEAM_MEMBERS = "manage:team:members"
    
    # Billing permissions
    READ_BILLING = "read:billing"
    UPDATE_BILLING = "update:billing"
    MANAGE_SUBSCRIPTION = "manage:subscription"
    
    # Admin permissions
    ADMIN_ALL = "admin:*"
    
    # Client Portal permissions
    CLIENT_VIEW_ORDERS = "client:view:orders"
    CLIENT_VIEW_INVOICES = "client:view:invoices"
    CLIENT_VIEW_PROJECTS = "client:view:projects"
    CLIENT_VIEW_TICKETS = "client:view:tickets"
    CLIENT_SUBMIT_TICKETS = "client:submit:tickets"
    CLIENT_VIEW_PROFILE = "client:view:profile"
    CLIENT_UPDATE_PROFILE = "client:update:profile"
    
    # Employee/ERP Portal permissions
    ERP_VIEW_ALL_ORDERS = "erp:view:all:orders"
    ERP_MANAGE_ORDERS = "erp:manage:orders"
    ERP_VIEW_INVENTORY = "erp:view:inventory"
    ERP_MANAGE_INVENTORY = "erp:manage:inventory"
    ERP_VIEW_CLIENTS = "erp:view:clients"
    ERP_MANAGE_CLIENTS = "erp:manage:clients"
    ERP_VIEW_INVOICES = "erp:view:invoices"
    ERP_MANAGE_INVOICES = "erp:manage:invoices"
    ERP_VIEW_REPORTS = "erp:view:reports"
    ERP_MANAGE_REPORTS = "erp:manage:reports"
    
    # Department-specific permissions
    SALES_VIEW_ORDERS = "sales:view:orders"
    SALES_MANAGE_ORDERS = "sales:manage:orders"
    ACCOUNTING_VIEW_INVOICES = "accounting:view:invoices"
    ACCOUNTING_MANAGE_INVOICES = "accounting:manage:invoices"
    INVENTORY_VIEW_STOCK = "inventory:view:stock"
    INVENTORY_MANAGE_STOCK = "inventory:manage:stock"


async def get_user_permissions(user: User, db: AsyncSession) -> List[str]:
    """
    Get all permissions for a user (async version using RBACService).
    
    Combines role-based permissions with user-specific custom permissions.
    Uses RBACService to fetch permissions from database.
    
    @param user - User object
    @param db - Database session
    @returns List of permission strings
    
    @example
    ```python
    permissions = await get_user_permissions(user, db)
    # ["read:project", "update:project", "create:project"]
    ```
    """
    rbac_service = RBACService(db)
    permissions_set = await rbac_service.get_user_permissions(user.id)
    return sorted(list(permissions_set))


async def get_role_permissions(role_slug: str, db: AsyncSession) -> List[str]:
    """
    Get permissions for a role from database (async version using RBACService).
    
    NOTE: This function now queries the database instead of using hardcoded permissions.
    For backward compatibility, you can still use the hardcoded version via get_role_permissions_hardcoded().
    
    @param role_slug - Slug of the role (e.g., "admin", "user")
    @param db - Database session
    @returns List of permission strings
    
    @example
    ```python
    permissions = await get_role_permissions("admin", db)
    # ["admin:*", "read:user", "update:user", ...]
    ```
    """
    rbac_service = RBACService(db)
    # First, get the role by slug
    from app.models import Role
    result = await db.execute(select(Role).where(Role.slug == role_slug))
    role = result.scalar_one_or_none()
    
    if not role:
        return []
    
    # Get permissions for this role
    permissions = await rbac_service.get_role_permissions(role.id)
    return [p.name for p in permissions]


def get_role_permissions_hardcoded(role_name: str) -> List[str]:
    """
    Get permissions for a role (hardcoded version - DEPRECATED).
    
    This function is kept for backward compatibility and seeding purposes.
    Use get_role_permissions() for database-based permissions.
    
    @param role_name - Name of the role (or slug)
    @returns List of permission strings
    """
    role_permissions = {
        "superadmin": [
            Permission.ADMIN_ALL,  # SuperAdmin has all permissions
        ],
        "admin": [
            Permission.ADMIN_ALL,
            Permission.LIST_USERS,
            Permission.UPDATE_USER,
            Permission.DELETE_USER,
        ],
        "manager": [
            Permission.MANAGE_TEAM_MEMBERS,
            Permission.UPDATE_TEAM,
            Permission.DELETE_TEAM,
        ],
        "member": [
            Permission.READ_TEAM,
            Permission.READ_PROJECT,
        ],
        "client": [
            Permission.CLIENT_VIEW_ORDERS,
            Permission.CLIENT_VIEW_INVOICES,
            Permission.CLIENT_VIEW_PROJECTS,
            Permission.CLIENT_VIEW_TICKETS,
            Permission.CLIENT_SUBMIT_TICKETS,
            Permission.CLIENT_VIEW_PROFILE,
            Permission.CLIENT_UPDATE_PROFILE,
        ],
        "employee": [
            Permission.ERP_VIEW_ALL_ORDERS,
            Permission.ERP_VIEW_INVENTORY,
            Permission.ERP_VIEW_CLIENTS,
            Permission.ERP_VIEW_INVOICES,
            Permission.ERP_VIEW_REPORTS,
        ],
        "sales": [
            Permission.SALES_VIEW_ORDERS,
            Permission.SALES_MANAGE_ORDERS,
            Permission.ERP_VIEW_CLIENTS,
        ],
        "accounting": [
            Permission.ACCOUNTING_VIEW_INVOICES,
            Permission.ACCOUNTING_MANAGE_INVOICES,
            Permission.ERP_VIEW_REPORTS,
        ],
        "inventory": [
            Permission.INVENTORY_VIEW_STOCK,
            Permission.INVENTORY_MANAGE_STOCK,
            Permission.ERP_VIEW_INVENTORY,
        ],
    }
    
    return role_permissions.get(role_name.lower(), [])


async def has_permission(user: User, permission: str, db: AsyncSession) -> bool:
    """
    Check if user has a specific permission (async version using RBACService).
    
    @param user - User object
    @param permission - Permission string (e.g., "read:project")
    @param db - Database session
    @returns True if user has permission
    
    @example
    ```python
    if await has_permission(user, Permission.READ_PROJECT, db):
        # User can read projects
        pass
    ```
    """
    rbac_service = RBACService(db)
    return await rbac_service.has_permission(user.id, permission)


async def has_resource_permission(
    user: User,
    permission: str,
    resource_id: str,
    db: AsyncSession,
    resource_owner_check: Optional[Callable] = None
) -> bool:
    """
    Check if user has permission for a specific resource.
    
    Supports:
    - Global permissions (e.g., "read:project")
    - Resource ownership checks
    - Custom resource-level checks
    
    @param user - User object
    @param permission - Permission string
    @param resource_id - Resource identifier
    @param db - Database session
    @param resource_owner_check - Optional function to check resource ownership
    @returns True if user has permission
    
    @example
    ```python
    def check_project_owner(project_id: str, user_id: str) -> bool:
        project = get_project(project_id)
        return project.owner_id == user_id
    
    has_access = await has_resource_permission(
        user,
        Permission.UPDATE_PROJECT,
        project_id,
        db,
        resource_owner_check=check_project_owner
    )
    ```
    """
    # Check global permission first
    if await has_permission(user, permission, db):
        return True
    
    # Check resource ownership if provided
    if resource_owner_check:
        try:
            return resource_owner_check(resource_id, str(user.id))
        except Exception:
            return False
    
    # Check if user is the resource owner (default check)
    # This can be overridden with custom logic
    return False


def require_permission(permission: str):
    """
    Decorator to require a specific permission.
    
    @param permission - Permission string required
    @returns Decorator function
    
    @example
    ```python
    @router.get("/projects")
    @require_permission(Permission.LIST_PROJECTS)
    async def list_projects(current_user: User = Depends(get_current_user)):
        # Only users with LIST_PROJECTS permission can access
        pass
    ```
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs or dependencies
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not db:
                # Try to get db from dependencies
                db = kwargs.get('db_session') or Depends(get_db)
            
            if not await has_permission(current_user, permission, db):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_resource_permission(
    permission: str,
    resource_id_param: str = "resource_id",
    resource_owner_check: Optional[Callable] = None
):
    """
    Decorator to require permission for a specific resource.
    
    @param permission - Permission string required
    @param resource_id_param - Name of the parameter containing resource ID
    @param resource_owner_check - Optional function to check resource ownership
    @returns Decorator function
    
    @example
    ```python
    @router.get("/projects/{project_id}")
    @require_resource_permission(Permission.READ_PROJECT, "project_id")
    async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
        # Only users with READ_PROJECT permission for this project can access
        pass
    ```
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            resource_id = kwargs.get(resource_id_param)
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not resource_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Resource ID parameter '{resource_id_param}' not found"
                )
            
            if not await has_resource_permission(
                current_user,
                permission,
                resource_id,
                db,
                resource_owner_check
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission} for resource {resource_id}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def check_permission_dependency(
    permission: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> bool:
    """
    FastAPI dependency to check permissions.
    
    @param permission - Permission string to check
    @param current_user - Current authenticated user (dependency)
    @param db - Database session (dependency)
    @returns True if user has permission, raises 403 otherwise
    
    @example
    ```python
    @router.get("/admin/users")
    async def list_users(
        has_permission: bool = Depends(check_permission_dependency(Permission.LIST_USERS))
    ):
        # Only users with LIST_USERS permission can access
        pass
    ```
    """
    if not await has_permission(current_user, permission, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission}"
        )
    return True

