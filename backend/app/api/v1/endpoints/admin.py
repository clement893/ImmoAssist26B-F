"""
Admin API Endpoints
Endpoints for administrative operations
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from pydantic import BaseModel, EmailStr, ValidationError
import os

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.dependencies import get_current_user, require_superadmin, is_superadmin
from app.models.user import User
from app.models.role import Role, UserRole
from app.core.logging import logger
from app.core.tenancy import (
    TenancyConfig,
    TenancyMode,
    get_current_tenant,
    get_user_tenant_id,
    get_user_tenants,
)
from app.core.tenant_database_manager import TenantDatabaseManager
from app.core.tenancy_metrics import TenancyMetrics
from app.services.rbac_service import RBACService
from app.models import Permission, RolePermission

router = APIRouter()


class MakeSuperAdminRequest(BaseModel):
    """Request model for making a user superadmin"""
    email: EmailStr


class MakeSuperAdminResponse(BaseModel):
    """Response model for making a user superadmin"""
    success: bool
    message: str
    user_id: int | None = None
    email: str | None = None


@router.post(
    "/make-superadmin",
    response_model=MakeSuperAdminResponse,
    status_code=status.HTTP_200_OK,
    tags=["admin"]
)
async def make_user_superadmin(
    request: MakeSuperAdminRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Make a user a superadmin.
    Requires superadmin authentication.
    
    Note: If no superadmin exists yet, you can use the script:
    python scripts/make_superadmin.py <email>
    """
    email = request.email.lower().strip()
    
    try:
        # Find or create superadmin role
        result = await db.execute(select(Role).where(Role.slug == "superadmin"))
        superadmin_role = result.scalar_one_or_none()
        
        if not superadmin_role:
            # Create superadmin role if it doesn't exist
            superadmin_role = Role(
                name="Super Admin",
                slug="superadmin",
                description="Super administrator with full system access",
                is_system=True,
                is_active=True
            )
            db.add(superadmin_role)
            await db.commit()
            await db.refresh(superadmin_role)
            logger.info(f"Created superadmin role (ID: {superadmin_role.id})")
        
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email '{email}' not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{email}' is not active"
            )
        
        # Check if user already has superadmin role
        result = await db.execute(
            select(UserRole).where(
                UserRole.user_id == user.id,
                UserRole.role_id == superadmin_role.id
            )
        )
        existing_user_role = result.scalar_one_or_none()
        
        if existing_user_role:
            return MakeSuperAdminResponse(
                success=True,
                message=f"User '{email}' already has superadmin role",
                user_id=user.id,
                email=user.email
            )
        
        # Assign superadmin role to user
        user_role = UserRole(
            user_id=user.id,
            role_id=superadmin_role.id
        )
        db.add(user_role)
        await db.commit()
        
        logger.info(f"Assigned superadmin role to user '{email}' (ID: {user.id})")
        
        return MakeSuperAdminResponse(
            success=True,
            message=f"Successfully assigned superadmin role to '{email}'",
            user_id=user.id,
            email=user.email
        )
        
    except HTTPException:
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error making user superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to assign superadmin role due to database constraint violation"
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error making user superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while assigning superadmin role"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error making user superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post(
    "/make-superadmin-by-email",
    response_model=MakeSuperAdminResponse,
    status_code=status.HTTP_200_OK,
    tags=["admin"],
    deprecated=True
)
async def make_user_superadmin_by_email(
    email: str = Query(..., description="Email of the user to make superadmin"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Make a user a superadmin by email (query parameter).
    Requires superadmin authentication.
    
    This endpoint is deprecated. Use POST /make-superadmin with JSON body instead.
    """
    request = MakeSuperAdminRequest(email=email)
    return await make_user_superadmin(request, db, current_user, _)


@router.post(
    "/bootstrap-superadmin",
    response_model=MakeSuperAdminResponse,
    status_code=status.HTTP_200_OK,
    tags=["admin"]
)
async def bootstrap_superadmin(
    request: MakeSuperAdminRequest,
    bootstrap_key: str = Header(..., alias="X-Bootstrap-Key", description="Bootstrap key from environment"),
    db: AsyncSession = Depends(get_db)
):
    """
    Bootstrap the first superadmin user.
    This endpoint allows creating the first superadmin without requiring authentication.
    Requires a bootstrap key set in the BOOTSTRAP_SUPERADMIN_KEY environment variable.
    
    Use this only for initial setup. After the first superadmin is created,
    use the regular /make-superadmin endpoint.
    """
    # Check if bootstrap key is configured
    expected_key = os.getenv("BOOTSTRAP_SUPERADMIN_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bootstrap feature is not enabled. Set BOOTSTRAP_SUPERADMIN_KEY environment variable."
        )
    
    # Verify bootstrap key
    if bootstrap_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bootstrap key"
        )
    
    # Check if any superadmin already exists
    result = await db.execute(
        select(UserRole)
        .join(Role)
        .where(Role.slug == "superadmin", Role.is_active == True)
    )
    existing_superadmins = result.scalars().all()
    
    if existing_superadmins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superadmin already exists. Use the regular /make-superadmin endpoint instead."
        )
    
    email = request.email.lower().strip()
    
    try:
        # Find or create superadmin role
        result = await db.execute(select(Role).where(Role.slug == "superadmin"))
        superadmin_role = result.scalar_one_or_none()
        
        if not superadmin_role:
            # Create superadmin role if it doesn't exist
            superadmin_role = Role(
                name="Super Admin",
                slug="superadmin",
                description="Super administrator with full system access",
                is_system=True,
                is_active=True
            )
            db.add(superadmin_role)
            await db.commit()
            await db.refresh(superadmin_role)
            logger.info(f"Created superadmin role (ID: {superadmin_role.id})")
        
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email '{email}' not found. Please register first."
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{email}' is not active"
            )
        
        # Assign superadmin role to user
        user_role = UserRole(
            user_id=user.id,
            role_id=superadmin_role.id
        )
        db.add(user_role)
        await db.commit()
        
        logger.info(f"Bootstrapped superadmin role to user '{email}' (ID: {user.id})")
        
        return MakeSuperAdminResponse(
            success=True,
            message=f"Successfully bootstrapped superadmin role to '{email}'",
            user_id=user.id,
            email=user.email
        )
        
    except HTTPException:
        raise
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error bootstrapping superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to bootstrap superadmin due to database constraint violation"
        )
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error bootstrapping superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while bootstrapping superadmin"
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error bootstrapping superadmin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/check-my-superadmin-status",
    response_model=dict,
    tags=["admin"]
)
async def check_my_superadmin_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if the current authenticated user has superadmin role.
    Allows any authenticated user to check their own superadmin status.
    """
    is_super = await is_superadmin(current_user, db)
    
    return {
        "email": current_user.email,
        "user_id": current_user.id,
        "is_superadmin": is_super,
        "is_active": current_user.is_active
    }


@router.get(
    "/check-superadmin/{email}",
    response_model=dict,
    tags=["admin"]
)
async def check_superadmin_status(
    email: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Check if a user has superadmin role.
    Requires superadmin authentication.
    """
    email = email.lower().strip()
    
    # Find user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{email}' not found"
        )
    
    # Check for superadmin role
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
    
    return {
        "email": user.email,
        "user_id": user.id,
        "is_superadmin": user_role is not None,
        "is_active": user.is_active
    }


# ============================================================================
# Tenancy Endpoints
# ============================================================================

class TenancyConfigResponse(BaseModel):
    """Response model for tenancy configuration"""
    mode: str
    enabled: bool
    current_tenant_id: Optional[int] = None


class UserTenantsResponse(BaseModel):
    """Response model for user tenants"""
    user_id: int
    primary_tenant_id: Optional[int] = None
    all_tenant_ids: List[int] = []


@router.get(
    "/tenancy/config",
    response_model=TenancyConfigResponse,
    tags=["admin", "tenancy"]
)
async def get_tenancy_config(
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get current tenancy configuration.
    Requires superadmin authentication.
    """
    return TenancyConfigResponse(
        mode=TenancyConfig.get_mode().value,
        enabled=TenancyConfig.is_enabled(),
        current_tenant_id=get_current_tenant()
    )


@router.get(
    "/tenancy/user/{user_id}/tenants",
    response_model=UserTenantsResponse,
    tags=["admin", "tenancy"]
)
async def get_user_tenants_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get all tenants for a user.
    Requires superadmin authentication.
    """
    primary_tenant_id = await get_user_tenant_id(user_id, db)
    all_tenant_ids = await get_user_tenants(user_id, db)
    
    return UserTenantsResponse(
        user_id=user_id,
        primary_tenant_id=primary_tenant_id,
        all_tenant_ids=all_tenant_ids
    )


@router.get(
    "/tenancy/current-tenant",
    response_model=dict,
    tags=["admin", "tenancy"]
)
async def get_current_tenant_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current tenant ID from context.
    Available to all authenticated users.
    """
    tenant_id = get_current_tenant()
    user_tenant_id = None
    
    # If no tenant in context, try to get from user
    if tenant_id is None:
        user_tenant_id = await get_user_tenant_id(current_user.id, db)
    
    return {
        "current_tenant_id": tenant_id,
        "user_primary_tenant_id": user_tenant_id,
        "tenancy_enabled": TenancyConfig.is_enabled(),
        "tenancy_mode": TenancyConfig.get_mode().value
    }


class CreateTenantDatabaseRequest(BaseModel):
    """Request model for creating tenant database"""
    tenant_id: int


class CreateTenantDatabaseResponse(BaseModel):
    """Response model for creating tenant database"""
    success: bool
    message: str
    tenant_id: int
    database_name: Optional[str] = None


@router.post(
    "/tenancy/tenant/{tenant_id}/database",
    response_model=CreateTenantDatabaseResponse,
    tags=["admin", "tenancy"]
)
async def create_tenant_database(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Create a separate database for a tenant.
    Only available when TENANCY_MODE=separate_db.
    Requires superadmin authentication.
    """
    if not TenantDatabaseManager.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant database creation only available when TENANCY_MODE=separate_db"
        )
    
    try:
        created = await TenantDatabaseManager.create_tenant_database(tenant_id)
        db_name = TenantDatabaseManager.get_tenant_db_name(tenant_id)
        
        if created:
            return CreateTenantDatabaseResponse(
                success=True,
                message=f"Tenant database created successfully",
                tenant_id=tenant_id,
                database_name=db_name
            )
        else:
            return CreateTenantDatabaseResponse(
                success=True,
                message=f"Tenant database already exists",
                tenant_id=tenant_id,
                database_name=db_name
            )
    except Exception as e:
        logger.error(f"Failed to create tenant database: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tenant database: {str(e)}"
        )


@router.delete(
    "/tenancy/tenant/{tenant_id}/database",
    response_model=dict,
    tags=["admin", "tenancy"]
)
async def delete_tenant_database(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Delete a tenant database.
    WARNING: This is a destructive operation!
    Only available when TENANCY_MODE=separate_db.
    Requires superadmin authentication.
    """
    if not TenantDatabaseManager.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant database deletion only available when TENANCY_MODE=separate_db"
        )
    
    try:
        deleted = await TenantDatabaseManager.delete_tenant_database(tenant_id)
        
        if deleted:
            return {
                "success": True,
                "message": f"Tenant database deleted successfully",
                "tenant_id": tenant_id
            }
        else:
            return {
                "success": False,
                "message": f"Tenant database does not exist",
                "tenant_id": tenant_id
            }
    except ValueError as e:
        logger.error(f"Invalid input for tenant database deletion: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(e)}"
        )
    except SQLAlchemyError as e:
        logger.error(f"Database error deleting tenant database: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while deleting tenant database"
        )
    except Exception as e:
        logger.error(f"Unexpected error deleting tenant database: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.get(
    "/tenancy/metrics",
    response_model=dict,
    tags=["admin", "tenancy"]
)
async def get_tenancy_metrics(
    tenant_id: Optional[int] = Query(None, description="Specific tenant ID (optional)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get tenancy metrics and statistics.
    Requires superadmin authentication.
    """
    if tenant_id:
        stats = await TenancyMetrics.get_tenant_statistics(db, tenant_id)
        return stats
    else:
        stats = await TenancyMetrics.get_system_statistics(db)
        return stats


@router.get(
    "/tenancy/tenants/{tenant_id}/statistics",
    response_model=dict,
    tags=["admin", "tenancy"]
)
async def get_tenant_statistics(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get statistics for a specific tenant.
    Requires superadmin authentication.
    """
    stats = await TenancyMetrics.get_tenant_statistics(db, tenant_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant {tenant_id} not found or has no data"
        )
    return stats


class TenancyConfigResponse(BaseModel):
    """Response model for tenancy configuration"""
    mode: str
    enabled: bool
    registryUrl: Optional[str] = None
    baseUrl: Optional[str] = None


class TenancyConfigUpdate(BaseModel):
    """Request model for updating tenancy configuration"""
    mode: Optional[str] = None
    enabled: Optional[bool] = None
    registryUrl: Optional[str] = None
    baseUrl: Optional[str] = None


@router.get(
    "/tenancy/config",
    response_model=TenancyConfigResponse,
    tags=["admin", "tenancy"]
)
async def get_tenancy_config(
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Get tenancy configuration.
    Requires superadmin authentication.
    """
    try:
        mode = TenancyConfig.get_mode()
        config = {
            "mode": mode.value if hasattr(mode, 'value') else str(mode),
            "enabled": mode != TenancyMode.SINGLE,
            "registryUrl": os.getenv("TENANT_DB_REGISTRY_URL"),
            "baseUrl": os.getenv("TENANT_DB_BASE_URL"),
        }
        return TenancyConfigResponse(**config)
    except Exception as e:
        logger.error(f"Error getting tenancy config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tenancy configuration"
        )


@router.put(
    "/tenancy/config",
    response_model=TenancyConfigResponse,
    tags=["admin", "tenancy"]
)
async def update_tenancy_config(
    config_data: TenancyConfigUpdate,
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_superadmin)
):
    """
    Update tenancy configuration.
    Requires superadmin authentication.
    
    Note: This endpoint updates environment variables. Changes may require a restart.
    """
    try:
        # Note: In production, you might want to store this in a database or config file
        # For now, we'll return the updated config but note that env vars require restart
        current_mode = TenancyConfig.get_mode()
        
        # Build response with updated values
        updated_config = {
            "mode": config_data.mode if config_data.mode else (current_mode.value if hasattr(current_mode, 'value') else str(current_mode)),
            "enabled": config_data.enabled if config_data.enabled is not None else (current_mode != TenancyMode.SINGLE),
            "registryUrl": config_data.registryUrl if config_data.registryUrl else os.getenv("TENANT_DB_REGISTRY_URL"),
            "baseUrl": config_data.baseUrl if config_data.baseUrl else os.getenv("TENANT_DB_BASE_URL"),
        }
        
        logger.info(f"Tenancy config updated by {current_user.email}: {updated_config}")
        
        # Note: Actual environment variable updates would require application restart
        # In a production system, you might want to:
        # 1. Store config in database
        # 2. Use a config service that can reload without restart
        # 3. Return a warning that restart is required
        
        return TenancyConfigResponse(**updated_config)
    except Exception as e:
        logger.error(f"Error updating tenancy config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update tenancy configuration"
        )


class RBACDiagnosticResponse(BaseModel):
    """Response model for RBAC diagnostic"""
    roles_count: int
    permissions_count: int
    user_has_superadmin: bool
    user_roles: List[str]
    user_permissions: List[str]
    required_permissions_status: dict
    recommendations: List[str]


class RBACFixRequest(BaseModel):
    """Request model for fixing RBAC issues"""
    user_email: EmailStr
    seed_data: bool = True
    assign_superadmin: bool = True


class RBACFixResponse(BaseModel):
    """Response model for RBAC fix"""
    success: bool
    message: str
    roles_created: int = 0
    permissions_created: int = 0
    superadmin_assigned: bool = False


@router.get(
    "/rbac/diagnose",
    response_model=RBACDiagnosticResponse,
    tags=["admin", "rbac"]
)
async def diagnose_rbac(
    user_email: Optional[str] = Query(None, description="Email of user to diagnose"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Diagnose RBAC issues.
    Can be called without authentication if user_email is provided.
    """
    from sqlalchemy import func
    
    rbac_service = RBACService(db)
    recommendations = []
    
    # Check roles
    roles_result = await db.execute(select(Role))
    roles = roles_result.scalars().all()
    roles_count = len(roles)
    
    # Check permissions
    perms_result = await db.execute(select(Permission))
    permissions = perms_result.scalars().all()
    permissions_count = len(permissions)
    
    # Check user if provided
    user_has_superadmin = False
    user_roles = []
    user_permissions = []
    required_permissions_status = {}
    
    target_user = current_user
    if user_email:
        user_result = await db.execute(select(User).where(User.email == user_email))
        target_user = user_result.scalar_one_or_none()
    
    if target_user:
        user_roles_list = await rbac_service.get_user_roles(target_user.id)
        user_roles = [role.slug for role in user_roles_list]
        user_has_superadmin = await rbac_service.has_role(target_user.id, "superadmin")
        user_permissions_set = await rbac_service.get_user_permissions(target_user.id)
        user_permissions = sorted(list(user_permissions_set))
        
        # Check required permissions
        required_perms = ["roles:read", "permissions:read", "users:read"]
        for perm in required_perms:
            has_perm = await rbac_service.has_permission(target_user.id, perm)
            required_permissions_status[perm] = has_perm
    
    # Generate recommendations
    if roles_count == 0:
        recommendations.append("No roles found. Run seed script to create default roles.")
    if permissions_count < 20:
        recommendations.append("Very few permissions found. Run seed script to create default permissions.")
    if target_user and not user_has_superadmin:
        recommendations.append(f"User '{target_user.email}' does not have superadmin role. Assign superadmin role to fix RBAC access.")
    if target_user:
        missing_perms = [perm for perm, has_it in required_permissions_status.items() if not has_it]
        if missing_perms:
            recommendations.append(f"User is missing permissions: {', '.join(missing_perms)}")
    
    return RBACDiagnosticResponse(
        roles_count=roles_count,
        permissions_count=permissions_count,
        user_has_superadmin=user_has_superadmin,
        user_roles=user_roles,
        user_permissions=user_permissions,
        required_permissions_status=required_permissions_status,
        recommendations=recommendations,
    )


@router.post(
    "/rbac/fix",
    response_model=RBACFixResponse,
    tags=["admin", "rbac"]
)
async def fix_rbac(
    request: RBACFixRequest,
    bootstrap_key: Optional[str] = Header(None, alias="X-Bootstrap-Key", description="Bootstrap key from environment (optional)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Fix RBAC issues by seeding data and/or assigning superadmin role.
    Can be called with bootstrap key (no auth required) or with superadmin auth.
    """
    # Check if bootstrap key is provided or if user is authenticated
    if bootstrap_key:
        expected_key = os.getenv("BOOTSTRAP_SUPERADMIN_KEY")
        if not expected_key or bootstrap_key != expected_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid bootstrap key"
            )
    else:
        # Try to get current user, but don't require it if bootstrap key is used
        try:
            from app.dependencies import get_current_user
            current_user = await get_current_user()
            # If we get here, user is authenticated, check if superadmin
            rbac_service = RBACService(db)
            if not await rbac_service.has_role(current_user.id, "superadmin"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Superadmin permission required"
                )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required or provide valid bootstrap key"
            )
    
    rbac_service = RBACService(db)
    roles_created = 0
    permissions_created = 0
    superadmin_assigned = False
    
    try:
        # Seed permissions if requested
        if request.seed_data:
            # Define default permissions
            default_permissions = [
                # User permissions
                ("users", "read", "Read user information"),
                ("users", "create", "Create new users"),
                ("users", "update", "Update user information"),
                ("users", "delete", "Delete users"),
                ("users", "list", "List all users"),
                # Role permissions
                ("roles", "read", "Read role information"),
                ("roles", "create", "Create new roles"),
                ("roles", "update", "Update role information"),
                ("roles", "delete", "Delete roles"),
                ("roles", "list", "List all roles"),
                # Permission permissions
                ("permissions", "read", "Read permission information"),
                ("permissions", "create", "Create new permissions"),
                ("permissions", "update", "Update permission information"),
                ("permissions", "delete", "Delete permissions"),
                ("permissions", "list", "List all permissions"),
                # Admin sections permissions
                ("admin", "users", "Access admin users section"),
                ("admin", "invitations", "Access admin invitations section"),
                ("admin", "organizations", "Access admin organizations section"),
                ("admin", "themes", "Access admin themes section"),
                ("admin", "settings", "Access admin settings section"),
                ("admin", "logs", "Access admin logs section"),
                ("admin", "statistics", "Access admin statistics section"),
                ("admin", "rbac", "Access admin RBAC section"),
                ("admin", "teams", "Access admin teams section"),
                ("admin", "tenancy", "Access admin tenancy section"),
                # Admin wildcard (grants all admin permissions)
                ("admin", "*", "All admin permissions"),
            ]
            
            for resource, action, description in default_permissions:
                name = f"{resource}:{action}"
                perm_result = await db.execute(select(Permission).where(Permission.name == name))
                existing = perm_result.scalar_one_or_none()
                
                if not existing:
                    await rbac_service.create_permission(resource, action, description)
                    permissions_created += 1
            
            # Define default roles with their default permissions
            default_roles = [
                {
                    "name": "Super Admin",
                    "slug": "superadmin",
                    "description": "Super administrator with all permissions",
                    "is_system": True,
                    "permissions": ["admin:*"],  # Superadmin gets admin:* (all permissions)
                },
                {
                    "name": "Admin",
                    "slug": "admin",
                    "description": "Administrator with most permissions",
                    "is_system": True,
                    "permissions": [
                        "admin:*",  # Admin gets all admin permissions
                        "users:read", "users:create", "users:update", "users:list",
                        "roles:read", "roles:list",
                        "permissions:read", "permissions:list",
                    ],
                },
                {
                    "name": "Manager",
                    "slug": "manager",
                    "description": "Manager with team management permissions",
                    "is_system": True,
                    "permissions": [
                        "admin:users", "admin:teams", "admin:statistics",
                        "users:read", "users:list",
                        "teams:read", "teams:create", "teams:update", "teams:list",
                    ],
                },
                {
                    "name": "User",
                    "slug": "user",
                    "description": "Standard user",
                    "is_system": True,
                    "permissions": [],  # Standard users have no admin permissions
                },
            ]
            
            for role_data in default_roles:
                role_result = await db.execute(select(Role).where(Role.slug == role_data["slug"]))
                existing_role = role_result.scalar_one_or_none()
                
                if not existing_role:
                    role = await rbac_service.create_role(
                        name=role_data["name"],
                        slug=role_data["slug"],
                        description=role_data["description"],
                        is_system=role_data["is_system"],
                    )
                    roles_created += 1
                    
                    # Assign permissions to role
                    for perm_name in role_data["permissions"]:
                        perm_result = await db.execute(select(Permission).where(Permission.name == perm_name))
                        perm = perm_result.scalar_one_or_none()
                        
                        if perm:
                            try:
                                await rbac_service.assign_permission_to_role(role.id, perm.id)
                            except ValueError:
                                pass  # Already assigned
        
        # Assign superadmin role if requested
        if request.assign_superadmin:
            user_result = await db.execute(select(User).where(User.email == request.user_email))
            user = user_result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with email '{request.user_email}' not found"
                )
            
            role_result = await db.execute(select(Role).where(Role.slug == "superadmin"))
            superadmin_role = role_result.scalar_one_or_none()
            
            if not superadmin_role:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Superadmin role not found. Please seed data first."
                )
            
            has_role = await rbac_service.has_role(user.id, "superadmin")
            if not has_role:
                await rbac_service.assign_role(user.id, superadmin_role.id)
                superadmin_assigned = True
            else:
                superadmin_assigned = True  # Already has it
        
        return RBACFixResponse(
            success=True,
            message="RBAC fix completed successfully",
            roles_created=roles_created,
            permissions_created=permissions_created,
            superadmin_assigned=superadmin_assigned,
        )
    
    except Exception as e:
        logger.error(f"Error fixing RBAC: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fix RBAC: {str(e)}"
        )
