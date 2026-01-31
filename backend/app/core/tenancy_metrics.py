"""
Tenancy Metrics and Monitoring

Provides metrics and monitoring capabilities for multi-tenancy.
"""

from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenancy import TenancyConfig, get_current_tenant
from app.core.logging import logger


class TenancyMetrics:
    """
    Metrics collector for multi-tenancy.
    
    Provides methods to collect and analyze tenancy-related metrics.
    """
    
    @staticmethod
    async def get_tenant_count(db: AsyncSession) -> int:
        """
        Get total number of tenants/teams.
        
        Args:
            db: Database session
        
        Returns:
            Number of active teams
        """
        if not TenancyConfig.is_enabled():
            return 0
        
        from app.models.team import Team
        
        result = await db.execute(
            select(func.count(Team.id)).where(Team.is_active == True)
        )
        return result.scalar() or 0
    
    @staticmethod
    async def get_tenant_user_count(
        db: AsyncSession,
        tenant_id: Optional[int] = None
    ) -> int:
        """
        Get number of users in a tenant.
        
        Args:
            db: Database session
            tenant_id: Tenant ID (if None, uses current tenant)
        
        Returns:
            Number of users in tenant
        """
        if not TenancyConfig.is_enabled():
            return 0
        
        if tenant_id is None:
            tenant_id = get_current_tenant()
        
        if tenant_id is None:
            return 0
        
        from app.models.team import TeamMember
        
        result = await db.execute(
            select(func.count(TeamMember.user_id))
            .where(
                and_(
                    TeamMember.team_id == tenant_id,
                    TeamMember.is_active == True
                )
            )
        )
        return result.scalar() or 0
    
    @staticmethod
    async def get_tenant_resource_count(
        db: AsyncSession,
        model_class,
        tenant_id: Optional[int] = None
    ) -> int:
        """
        Get number of resources for a tenant.
        
        Args:
            db: Database session
            model_class: Model class to count
            tenant_id: Tenant ID (if None, uses current tenant)
        
        Returns:
            Number of resources
        """
        if not TenancyConfig.is_enabled():
            return 0
        
        if tenant_id is None:
            tenant_id = get_current_tenant()
        
        if tenant_id is None:
            return 0
        
        if not hasattr(model_class, 'team_id'):
            return 0
        
        query = select(func.count(model_class.id)).where(
            model_class.team_id == tenant_id
        )
        result = await db.execute(query)
        return result.scalar() or 0
    
    @staticmethod
    async def get_tenant_statistics(
        db: AsyncSession,
        tenant_id: Optional[int] = None
    ) -> Dict:
        """
        Get comprehensive statistics for a tenant.
        
        Args:
            db: Database session
            tenant_id: Tenant ID (if None, uses current tenant)
        
        Returns:
            Dictionary with tenant statistics
        """
        if not TenancyConfig.is_enabled():
            return {}
        
        if tenant_id is None:
            tenant_id = get_current_tenant()
        
        if tenant_id is None:
            return {}
        
        stats = {
            "tenant_id": tenant_id,
            "users": await TenancyMetrics.get_tenant_user_count(db, tenant_id),
            "resources": {}
        }
        
        # Count resources for each tenant-aware model
        from app.models.project import Project
        from app.models.form import Form
        from app.models.page import Page
        from app.models.menu import Menu
        
        models = [
            ("projects", Project),
            ("forms", Form),
            ("pages", Page),
            ("menus", Menu),
        ]
        
        for name, model_class in models:
            if hasattr(model_class, 'team_id'):
                count = await TenancyMetrics.get_tenant_resource_count(
                    db, model_class, tenant_id
                )
                stats["resources"][name] = count
        
        return stats
    
    @staticmethod
    async def get_all_tenants_statistics(db: AsyncSession) -> List[Dict]:
        """
        Get statistics for all tenants.
        
        Args:
            db: Database session
        
        Returns:
            List of tenant statistics dictionaries
        """
        if not TenancyConfig.is_enabled():
            return []
        
        from app.models.team import Team
        
        # Get all active teams
        result = await db.execute(
            select(Team.id).where(Team.is_active == True)
        )
        tenant_ids = [row[0] for row in result.fetchall()]
        
        # Get statistics for each tenant
        statistics = []
        for tenant_id in tenant_ids:
            stats = await TenancyMetrics.get_tenant_statistics(db, tenant_id)
            if stats:
                statistics.append(stats)
        
        return statistics
    
    @staticmethod
    async def get_system_statistics(db: AsyncSession) -> Dict:
        """
        Get system-wide tenancy statistics.
        
        Args:
            db: Database session
        
        Returns:
            Dictionary with system statistics
        """
        if not TenancyConfig.is_enabled():
            return {
                "tenancy_enabled": False,
                "mode": TenancyConfig.get_mode().value
            }
        
        tenant_count = await TenancyMetrics.get_tenant_count(db)
        all_stats = await TenancyMetrics.get_all_tenants_statistics(db)
        
        total_users = sum(stats.get("users", 0) for stats in all_stats)
        total_resources = {}
        
        # Aggregate resource counts
        for stats in all_stats:
            for resource_type, count in stats.get("resources", {}).items():
                total_resources[resource_type] = (
                    total_resources.get(resource_type, 0) + count
                )
        
        return {
            "tenancy_enabled": True,
            "mode": TenancyConfig.get_mode().value,
            "tenant_count": tenant_count,
            "total_users": total_users,
            "total_resources": total_resources,
            "tenants": all_stats
        }


