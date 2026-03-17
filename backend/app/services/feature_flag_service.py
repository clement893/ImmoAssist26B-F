"""
Feature Flag Service
Manages feature flags and evaluations
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import hashlib

from app.models.feature_flag import FeatureFlag, FeatureFlagLog
from app.core.logging import logger


class FeatureFlagService:
    """Service for feature flag operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_flag(
        self,
        key: str,
        name: str,
        description: Optional[str] = None,
        enabled: bool = False,
        rollout_percentage: float = 0.0,
        target_users: Optional[List[int]] = None,
        target_teams: Optional[List[int]] = None,
        is_ab_test: bool = False,
        variants: Optional[Dict[str, Any]] = None,
        created_by_id: Optional[int] = None
    ) -> FeatureFlag:
        """Create a new feature flag"""
        # Check if flag with same key exists
        existing = await self.db.execute(
            select(FeatureFlag).where(FeatureFlag.key == key)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Feature flag with key '{key}' already exists")

        flag = FeatureFlag(
            key=key,
            name=name,
            description=description,
            enabled=enabled,
            rollout_percentage=rollout_percentage,
            target_users=target_users,
            target_teams=target_teams,
            is_ab_test=is_ab_test,
            variants=variants,
            created_by_id=created_by_id
        )
        
        self.db.add(flag)
        await self.db.commit()
        await self.db.refresh(flag)
        
        return flag

    async def get_flag(self, key: str) -> Optional[FeatureFlag]:
        """Get a feature flag by key"""
        result = await self.db.execute(
            select(FeatureFlag).where(FeatureFlag.key == key)
        )
        return result.scalar_one_or_none()

    async def get_all_flags(self, enabled_only: bool = False) -> List[FeatureFlag]:
        """Get all feature flags"""
        query = select(FeatureFlag).order_by(desc(FeatureFlag.created_at))
        
        if enabled_only:
            query = query.where(FeatureFlag.enabled == True)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def is_enabled(
        self,
        key: str,
        user_id: Optional[int] = None,
        team_id: Optional[int] = None
    ) -> bool:
        """Check if a feature flag is enabled for a user"""
        flag = await self.get_flag(key)
        if not flag:
            return False
        
        if not flag.enabled:
            return False
        
        # Check target users
        if flag.target_users and user_id:
            if user_id not in flag.target_users:
                return False
        
        # Check target teams
        if flag.target_teams and team_id:
            if team_id not in flag.target_teams:
                return False
        
        # Check rollout percentage
        if flag.rollout_percentage < 100.0:
            if user_id:
                # Deterministic rollout based on user ID
                hash_value = int(hashlib.md5(f"{key}:{user_id}".encode()).hexdigest(), 16)
                percentage = (hash_value % 100) + 1
                if percentage > flag.rollout_percentage:
                    return False
            else:
                # Random rollout for anonymous users
                import random
                if random.random() * 100 > flag.rollout_percentage:
                    return False
        
        # Log evaluation
        await self.log_evaluation(flag.id, user_id, True)
        
        return True

    async def get_variant(
        self,
        key: str,
        user_id: Optional[int] = None
    ) -> Optional[str]:
        """Get A/B test variant for a feature flag"""
        flag = await self.get_flag(key)
        if not flag or not flag.is_ab_test or not flag.variants:
            return None
        
        if not await self.is_enabled(key, user_id):
            return None
        
        # Deterministic variant assignment based on user ID
        if user_id:
            hash_value = int(hashlib.md5(f"{key}:{user_id}".encode()).hexdigest(), 16)
            variant_index = hash_value % len(flag.variants)
            variant_keys = list(flag.variants.keys())
            return variant_keys[variant_index]
        
        return None

    async def log_evaluation(
        self,
        flag_id: int,
        user_id: Optional[int],
        enabled: bool,
        variant: Optional[str] = None
    ) -> FeatureFlagLog:
        """Log feature flag evaluation"""
        log = FeatureFlagLog(
            flag_id=flag_id,
            user_id=user_id,
            enabled=enabled,
            variant=variant
        )
        
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        
        return log

    async def update_flag(
        self,
        flag_id: int,
        updates: Dict[str, Any]
    ) -> Optional[FeatureFlag]:
        """Update a feature flag"""
        flag = await self.db.get(FeatureFlag, flag_id)
        if not flag:
            return None
        
        for key, value in updates.items():
            if hasattr(flag, key) and value is not None:
                setattr(flag, key, value)
        
        await self.db.commit()
        await self.db.refresh(flag)
        
        return flag

    async def delete_flag(self, flag_id: int) -> bool:
        """Delete a feature flag"""
        flag = await self.db.get(FeatureFlag, flag_id)
        if not flag:
            return False
        
        await self.db.delete(flag)
        await self.db.commit()
        
        return True

    async def get_flag_stats(
        self,
        flag_id: int
    ) -> Dict[str, Any]:
        """Get statistics for a feature flag"""
        from sqlalchemy import func
        
        # Total evaluations
        total_result = await self.db.execute(
            select(func.count(FeatureFlagLog.id)).where(
                FeatureFlagLog.flag_id == flag_id
            )
        )
        total = total_result.scalar() or 0
        
        # Enabled evaluations
        enabled_result = await self.db.execute(
            select(func.count(FeatureFlagLog.id)).where(
                and_(
                    FeatureFlagLog.flag_id == flag_id,
                    FeatureFlagLog.enabled == True
                )
            )
        )
        enabled_count = enabled_result.scalar() or 0
        
        return {
            'total_evaluations': total,
            'enabled_count': enabled_count,
            'enabled_percentage': (enabled_count / total * 100) if total > 0 else 0
        }




