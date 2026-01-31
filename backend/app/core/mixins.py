"""
SQLAlchemy Mixins

Reusable mixins for SQLAlchemy models.
"""

from typing import TYPE_CHECKING, Optional
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import declared_attr, relationship

if TYPE_CHECKING:
    from sqlalchemy.orm import DeclarativeBase


def _is_tenancy_enabled() -> bool:
    """Check if tenancy is enabled (lazy import to avoid circular dependencies)"""
    try:
        from app.core.tenancy import TenancyConfig
        return TenancyConfig.is_enabled()
    except ImportError:
        return False


class TenantMixin:
    """
    Mixin to add tenant/team_id support to models
    
    This mixin is conditionally applied based on TENANCY_MODE:
    - If TENANCY_MODE=single: No team_id column is added (returns None)
    - If TENANCY_MODE=shared_db or separate_db: team_id column is added
    
    Usage:
        class Project(TenantMixin, Base):
            __tablename__ = "projects"
            id = Column(Integer, primary_key=True)
            name = Column(String(200))
            # team_id is automatically added if tenancy is enabled
    """
    
    @declared_attr
    def team_id(cls) -> Optional[Column]:
        """
        Add team_id column if tenancy is enabled
        
        Returns:
            Column if tenancy enabled, None otherwise
        """
        if _is_tenancy_enabled():
            return Column(
                Integer,
                ForeignKey("teams.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
                doc="Team/tenant ID for multi-tenancy isolation"
            )
        # Return None - SQLAlchemy will ignore None declared_attr
        return None
    
    @declared_attr
    def team(cls) -> Optional[relationship]:
        """
        Add team relationship if tenancy is enabled
        
        Returns:
            relationship if tenancy enabled, None otherwise
        """
        if _is_tenancy_enabled():
            return relationship(
                "Team",
                backref=cls.__tablename__,
                lazy="selectin",
                doc="Team/tenant relationship"
            )
        # Return None - SQLAlchemy will ignore None declared_attr
        return None
