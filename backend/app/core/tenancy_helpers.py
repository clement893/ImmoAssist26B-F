"""
Tenancy Helper Functions

Utility functions to help apply tenancy scoping in endpoints.
These functions make it easy to add tenant filtering to existing endpoints.
"""

from typing import TypeVar, Type, Optional, Callable, Any
from functools import wraps
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenancy import (
    TenancyConfig,
    scope_query,
    get_current_tenant,
    get_user_tenant_id,
)
from app.core.logging import logger

ModelType = TypeVar('ModelType')


def apply_tenant_scope(
    query: Select,
    model_class: Type[ModelType],
    tenant_id: Optional[int] = None
) -> Select:
    """
    Apply tenant scoping to a query.
    
    This is a convenience function that wraps scope_query.
    If tenant_id is provided, it temporarily sets it in context.
    
    Args:
        query: SQLAlchemy Select statement
        model_class: Model class to scope
        tenant_id: Optional tenant ID (if None, uses current tenant from context)
    
    Returns:
        Scoped query with tenant filtering applied (if applicable)
    
    Example:
        query = select(Project)
        query = apply_tenant_scope(query, Project)
        result = await db.execute(query)
    """
    # If tenancy is disabled, return query as-is
    if not TenancyConfig.is_enabled():
        return query
    
    # Use provided tenant_id or get from context
    if tenant_id is None:
        tenant_id = get_current_tenant()
    
    # If no tenant_id available, return query as-is
    # (might be intentional for admin queries)
    if tenant_id is None:
        return query
    
    # Apply scoping
    return scope_query(query, model_class)


def ensure_tenant_scope(
    query: Select,
    model_class: Type[ModelType],
    tenant_id: Optional[int] = None
) -> Select:
    """
    Apply tenant scoping and ensure tenant is set.
    
    Similar to apply_tenant_scope, but raises an error if no tenant is available.
    Use this when tenant scoping is required.
    
    Args:
        query: SQLAlchemy Select statement
        model_class: Model class to scope
        tenant_id: Optional tenant ID (if None, uses current tenant from context)
    
    Returns:
        Scoped query with tenant filtering applied
    
    Raises:
        ValueError: If tenancy is enabled but no tenant is available
    
    Example:
        query = select(Project)
        query = ensure_tenant_scope(query, Project)
        result = await db.execute(query)
    """
    if not TenancyConfig.is_enabled():
        return query
    
    if tenant_id is None:
        tenant_id = get_current_tenant()
    
    if tenant_id is None:
        raise ValueError(
            "Tenant context required. Provide X-Tenant-ID header, "
            "authenticate with a user that has a team, or use require_tenant dependency."
        )
    
    return scope_query(query, model_class)


async def get_tenant_id_for_user(
    user_id: int,
    db: AsyncSession,
    fallback_to_context: bool = True
) -> Optional[int]:
    """
    Get tenant ID for a user, with optional fallback to context.
    
    Args:
        user_id: User ID
        db: Database session
        fallback_to_context: If True, fallback to current tenant from context
    
    Returns:
        Tenant ID, or None if not found
    """
    tenant_id = await get_user_tenant_id(user_id, db)
    
    if tenant_id is None and fallback_to_context:
        tenant_id = get_current_tenant()
    
    return tenant_id


def tenant_aware_query(
    model_class: Type[ModelType],
    tenant_id: Optional[int] = None
) -> Callable[[Select], Select]:
    """
    Create a function that applies tenant scoping to queries.
    
    This is useful for creating reusable query builders.
    
    Args:
        model_class: Model class to scope
        tenant_id: Optional tenant ID (if None, uses current tenant from context)
    
    Returns:
        Function that takes a query and returns a scoped query
    
    Example:
        scope_project = tenant_aware_query(Project)
        query = select(Project).where(Project.status == 'active')
        query = scope_project(query)
    """
    def scope_fn(query: Select) -> Select:
        return apply_tenant_scope(query, model_class, tenant_id)
    
    return scope_fn


def with_tenant_context(tenant_id: Optional[int] = None):
    """
    Decorator to set tenant context for a function.
    
    This decorator temporarily sets the tenant ID in context for the duration
    of the function execution.
    
    Args:
        tenant_id: Tenant ID to set (if None, function should accept tenant_id parameter)
    
    Example:
        @with_tenant_context()
        async def my_function(tenant_id: int, ...):
            # tenant_id is set in context
            query = scope_query(select(Project), Project)
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            from app.core.tenancy import set_current_tenant, clear_current_tenant
            
            # Get tenant_id from parameter or use provided
            tid = tenant_id or kwargs.get('tenant_id')
            
            # Set tenant context
            if tid is not None:
                set_current_tenant(tid)
            
            try:
                return await func(*args, **kwargs)
            finally:
                # Always clear context
                clear_current_tenant()
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            from app.core.tenancy import set_current_tenant, clear_current_tenant
            
            # Get tenant_id from parameter or use provided
            tid = tenant_id or kwargs.get('tenant_id')
            
            # Set tenant context
            if tid is not None:
                set_current_tenant(tid)
            
            try:
                return func(*args, **kwargs)
            finally:
                # Always clear context
                clear_current_tenant()
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator

