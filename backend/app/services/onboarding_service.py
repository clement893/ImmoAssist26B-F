"""
Onboarding Service
Manages user onboarding flow
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.models.onboarding import OnboardingStep, UserOnboarding
from app.core.logging import logger


class OnboardingService:
    """Service for onboarding operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_steps(self, user_roles: Optional[List[str]] = None) -> List[OnboardingStep]:
        """Get active onboarding steps for a user"""
        query = select(OnboardingStep).where(
            OnboardingStep.is_active == True
        ).order_by(OnboardingStep.order)
        
        result = await self.db.execute(query)
        steps = list(result.scalars().all())
        
        # Filter by role targeting
        if user_roles:
            filtered = []
            for step in steps:
                if step.target_roles:
                    target_roles = json.loads(step.target_roles)
                    if any(role in target_roles for role in user_roles):
                        filtered.append(step)
                else:
                    # No targeting, show to all
                    filtered.append(step)
            return filtered
        
        return steps

    async def get_user_onboarding(self, user_id: int) -> Optional[UserOnboarding]:
        """Get user onboarding progress"""
        result = await self.db.execute(
            select(UserOnboarding).where(UserOnboarding.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def initialize_onboarding(
        self,
        user_id: int,
        user_roles: Optional[List[str]] = None
    ) -> UserOnboarding:
        """Initialize onboarding for a user"""
        existing = await self.get_user_onboarding(user_id)
        if existing:
            return existing
        
        steps = await self.get_active_steps(user_roles)
        current_step = steps[0].key if steps else None
        
        onboarding = UserOnboarding(
            user_id=user_id,
            current_step_key=current_step,
            completed_steps=[],
            skipped_steps=[]
        )
        
        self.db.add(onboarding)
        await self.db.commit()
        await self.db.refresh(onboarding)
        
        return onboarding

    async def complete_step(
        self,
        user_id: int,
        step_key: str
    ) -> Optional[UserOnboarding]:
        """Mark a step as completed"""
        onboarding = await self.get_user_onboarding(user_id)
        if not onboarding:
            return None
        
        completed = onboarding.completed_steps or []
        if step_key not in completed:
            completed.append(step_key)
            onboarding.completed_steps = completed
        
        # Move to next step
        steps = await self.get_active_steps()
        current_index = next(
            (i for i, s in enumerate(steps) if s.key == step_key),
            -1
        )
        
        if current_index >= 0 and current_index < len(steps) - 1:
            onboarding.current_step_key = steps[current_index + 1].key
        else:
            # All steps completed
            onboarding.current_step_key = None
            onboarding.is_completed = True
            from datetime import datetime
            onboarding.completed_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(onboarding)
        
        return onboarding

    async def skip_step(
        self,
        user_id: int,
        step_key: str
    ) -> Optional[UserOnboarding]:
        """Skip a step"""
        onboarding = await self.get_user_onboarding(user_id)
        if not onboarding:
            return None
        
        skipped = onboarding.skipped_steps or []
        if step_key not in skipped:
            skipped.append(step_key)
            onboarding.skipped_steps = skipped
        
        # Move to next step
        steps = await self.get_active_steps()
        current_index = next(
            (i for i, s in enumerate(steps) if s.key == step_key),
            -1
        )
        
        if current_index >= 0 and current_index < len(steps) - 1:
            onboarding.current_step_key = steps[current_index + 1].key
        else:
            onboarding.current_step_key = None
        
        await self.db.commit()
        await self.db.refresh(onboarding)
        
        return onboarding

    async def get_next_step(self, user_id: int) -> Optional[OnboardingStep]:
        """Get the next step for a user"""
        onboarding = await self.get_user_onboarding(user_id)
        if not onboarding or onboarding.is_completed:
            return None
        
        if onboarding.current_step_key:
            result = await self.db.execute(
                select(OnboardingStep).where(
                    OnboardingStep.key == onboarding.current_step_key
                )
            )
            return result.scalar_one_or_none()
        
        return None

    async def get_progress(self, user_id: int) -> Dict[str, Any]:
        """Get onboarding progress for a user"""
        onboarding = await self.get_user_onboarding(user_id)
        if not onboarding:
            return {
                'is_completed': False,
                'current_step': None,
                'completed_count': 0,
                'total_count': 0,
                'progress_percentage': 0
            }
        
        steps = await self.get_active_steps()
        completed_count = len(onboarding.completed_steps or [])
        total_count = len(steps)
        
        return {
            'is_completed': onboarding.is_completed,
            'current_step': onboarding.current_step_key,
            'completed_count': completed_count,
            'total_count': total_count,
            'progress_percentage': (completed_count / total_count * 100) if total_count > 0 else 0
        }




