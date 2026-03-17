"""
Multi-Tenancy Configuration and Utilities

This module provides configuration and utilities for multi-tenancy support.
The tenancy system can be enabled/disabled via the TENANCY_MODE environment variable.

Modes:
- single: No multi-tenancy (default) - single database, no filtering
- shared_db: Multi-tenancy with shared database - filtering by team_id
- separate_db: Multi-tenancy with separate databases - one DB per tenant

All tenancy features are conditionally enabled based on TENANCY_MODE.
"""

from enum import Enum
from typing import Optional, Any, TypeVar, Type
from contextvars import ContextVar
import os

from sqlalchemy import Select, select
from sqlalchemy.orm import Query
from sqlalchemy.ext.asyncio import AsyncSession

# Context variable for current tenant ID (thread-safe)
_current_tenant_id: ContextVar[Optional[int]] = ContextVar('_current_tenant_id', default=None)

# Type variable for model classes
ModelType = TypeVar('ModelType')


class TenancyMode(str, Enum):
    """Tenancy mode enumeration"""
    SINGLE = "single"  # No multi-tenancy
    SHARED_DB = "shared_db"  # Shared database with team_id filtering
    SEPARATE_DB = "separate_db"  # Separate database per tenant


class TenancyConfig:
    """
    Tenancy configuration class
    
    Provides static methods to check tenancy status and mode.
    All tenancy features should check this class before executing.
    """
    
    _mode: Optional[TenancyMode] = None
    _enabled: Optional[bool] = None
    
    @classmethod
    def _get_mode(cls) -> TenancyMode:
        """Get tenancy mode from environment variable"""
        if cls._mode is None:
            mode_str = os.getenv("TENANCY_MODE", "single").lower().strip()
            try:
                cls._mode = TenancyMode(mode_str)
            except ValueError:
                # Invalid mode, default to single
                cls._mode = TenancyMode.SINGLE
        return cls._mode
    
    @classmethod
    def _is_enabled(cls) -> bool:
        """Check if tenancy is enabled"""
        if cls._enabled is None:
            cls._enabled = cls._get_mode() != TenancyMode.SINGLE
        return cls._enabled
    
    @classmethod
    def get_mode(cls) -> TenancyMode:
        """
        Get current tenancy mode
        
        Returns:
            TenancyMode: Current tenancy mode
        """
        return cls._get_mode()
    
    @classmethod
    def is_enabled(cls) -> bool:
        """
        Check if multi-tenancy is enabled
        
        Returns:
            bool: True if tenancy is enabled, False otherwise
        """
        return cls._is_enabled()
    
    @classmethod
    def is_single_mode(cls) -> bool:
        """
        Check if running in single-tenant mode
        
        Returns:
            bool: True if single mode, False otherwise
        """
        return cls._get_mode() == TenancyMode.SINGLE
    
    @classmethod
    def is_shared_db_mode(cls) -> bool:
        """
        Check if running in shared database mode
        
        Returns:
            bool: True if shared DB mode, False otherwise
        """
        return cls._get_mode() == TenancyMode.SHARED_DB
    
    @classmethod
    def is_separate_db_mode(cls) -> bool:
        """
        Check if running in separate database mode
        
        Returns:
            bool: True if separate DB mode, False otherwise
        """
        return cls._get_mode() == TenancyMode.SEPARATE_DB
    
    @classmethod
    def reset(cls) -> None:
        """
        Reset configuration cache (useful for testing)
        """
        cls._mode = None
        cls._enabled = None


# ============================================================================
# Query Scoping Utilities
# ============================================================================

def set_current_tenant(tenant_id: Optional[int]) -> None:
    """
    Set the current tenant ID in context.
    
    This is used by middleware to set the tenant for the current request.
    
    Args:
        tenant_id: Team/tenant ID, or None to clear
    """
    _current_tenant_id.set(tenant_id)


def get_current_tenant() -> Optional[int]:
    """
    Get the current tenant ID from context.
    
    Returns:
        Current tenant ID, or None if not set
    """
    return _current_tenant_id.get(None)


def clear_current_tenant() -> None:
    """Clear the current tenant ID from context"""
    _current_tenant_id.set(None)


def scope_query(query: Select, model_class: Type[ModelType]) -> Select:
    """
    Apply tenant scoping to a SQLAlchemy query.
    
    This function automatically filters queries by team_id if:
    - Tenancy is enabled (not single mode)
    - Current tenant is set
    - Model has team_id attribute (via TenantMixin)
    
    Args:
        query: SQLAlchemy Select statement
        model_class: Model class to check for team_id attribute
    
    Returns:
        Scoped query with team_id filter applied (if applicable)
    """
    # If tenancy is disabled, return query as-is
    if not TenancyConfig.is_enabled():
        return query
    
    # If no current tenant is set, return query as-is
    # (in shared_db mode, this might be intentional for admin queries)
    tenant_id = get_current_tenant()
    if tenant_id is None:
        return query
    
    # Check if model has team_id attribute
    # This works for models using TenantMixin
    if not hasattr(model_class, 'team_id'):
        return query
    
    # Apply team_id filter
    # Note: This assumes the query is for the model_class
    # For joins, you may need to specify the table explicitly
    return query.where(model_class.team_id == tenant_id)


def scope_model_query(
    session: AsyncSession,
    model_class: Type[ModelType],
    *filters: Any
) -> Select:
    """
    Create a scoped query for a model.
    
    Convenience function that creates a select() query and applies tenant scoping.
    
    Args:
        session: Database session (unused, kept for API consistency)
        model_class: Model class to query
        *filters: Additional filter conditions
    
    Returns:
        Scoped Select statement
    
    Example:
        query = scope_model_query(db, Project)
        projects = await db.execute(query)
    """
    query = select(model_class)
    
    # Apply additional filters if provided
    for filter_condition in filters:
        query = query.where(filter_condition)
    
    # Apply tenant scoping
    return scope_query(query, model_class)


async def get_user_tenant_id(user_id: int, db: AsyncSession) -> Optional[int]:
    """
    Get the primary tenant ID for a user.
    
    In shared_db mode, returns the user's primary team ID.
    In separate_db mode, returns the tenant ID associated with the user.
    In single mode, returns None.
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        Tenant/team ID, or None if not found or tenancy disabled
    """
    if not TenancyConfig.is_enabled():
        return None
    
    from app.models.team import TeamMember
    
    # Get user's primary team (first active team membership)
    result = await db.execute(
        select(TeamMember.team_id)
        .where(
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        )
        .order_by(TeamMember.created_at.asc())
        .limit(1)
    )
    team_id = result.scalar_one_or_none()
    
    return team_id


async def get_user_tenants(user_id: int, db: AsyncSession) -> list[int]:
    """
    Get all tenant IDs for a user.
    
    Returns all teams the user is a member of.
    
    Args:
        user_id: User ID
        db: Database session
    
    Returns:
        List of tenant/team IDs
    """
    if not TenancyConfig.is_enabled():
        return []
    
    from app.models.team import TeamMember
    
    result = await db.execute(
        select(TeamMember.team_id)
        .where(
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        )
    )
    team_ids = result.scalars().all()
    
    return list(team_ids)

