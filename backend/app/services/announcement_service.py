"""
Announcement Service
Manages announcements and banners
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.models.announcement import Announcement, AnnouncementDismissal, AnnouncementType, AnnouncementPriority
from app.core.logging import logger


class AnnouncementService:
    """Service for announcement operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_announcement(
        self,
        title: str,
        message: str,
        type: AnnouncementType = AnnouncementType.INFO,
        priority: AnnouncementPriority = AnnouncementPriority.MEDIUM,
        is_active: bool = True,
        is_dismissible: bool = True,
        show_on_login: bool = False,
        show_in_app: bool = True,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        target_users: Optional[List[int]] = None,
        target_teams: Optional[List[int]] = None,
        target_roles: Optional[List[str]] = None,
        action_label: Optional[str] = None,
        action_url: Optional[str] = None,
        created_by_id: Optional[int] = None
    ) -> Announcement:
        """Create a new announcement"""
        announcement = Announcement(
            title=title,
            message=message,
            type=type,
            priority=priority,
            is_active=is_active,
            is_dismissible=is_dismissible,
            show_on_login=show_on_login,
            show_in_app=show_in_app,
            start_date=start_date,
            end_date=end_date,
            target_users=json.dumps(target_users) if target_users else None,
            target_teams=json.dumps(target_teams) if target_teams else None,
            target_roles=json.dumps(target_roles) if target_roles else None,
            action_label=action_label,
            action_url=action_url,
            created_by_id=created_by_id
        )
        
        self.db.add(announcement)
        await self.db.commit()
        await self.db.refresh(announcement)
        
        return announcement

    async def get_announcement(self, announcement_id: int) -> Optional[Announcement]:
        """Get an announcement by ID"""
        return await self.db.get(Announcement, announcement_id)

    async def get_active_announcements(
        self,
        user_id: Optional[int] = None,
        user_team_id: Optional[int] = None,
        user_roles: Optional[List[str]] = None,
        show_on_login: Optional[bool] = None
    ) -> List[Announcement]:
        """Get active announcements for a user"""
        now = datetime.utcnow()
        
        query = select(Announcement).where(
            and_(
                Announcement.is_active == True,
                or_(
                    Announcement.start_date == None,
                    Announcement.start_date <= now
                ),
                or_(
                    Announcement.end_date == None,
                    Announcement.end_date >= now
                )
            )
        )
        
        if show_on_login is not None:
            query = query.where(Announcement.show_on_login == show_on_login)
        else:
            query = query.where(Announcement.show_in_app == True)
        
        # Filter by targeting
        if user_id:
            # Check if user has dismissed this announcement
            dismissed_result = await self.db.execute(
                select(AnnouncementDismissal.announcement_id).where(
                    AnnouncementDismissal.user_id == user_id
                )
            )
            dismissed_ids = set(dismissed_result.scalars().all())
        
        result = await self.db.execute(query.order_by(desc(Announcement.priority), desc(Announcement.created_at)))
        announcements = list(result.scalars().all())
        
        # Filter by user targeting
        filtered = []
        for ann in announcements:
            # Skip if dismissed
            if user_id and ann.id in dismissed_ids:
                continue
            
            # Check user targeting
            if ann.target_users:
                target_users = json.loads(ann.target_users)
                if user_id not in target_users:
                    continue
            
            # Check team targeting
            if ann.target_teams:
                target_teams = json.loads(ann.target_teams)
                if user_team_id not in target_teams:
                    continue
            
            # Check role targeting
            if ann.target_roles:
                target_roles = json.loads(ann.target_roles)
                if not user_roles or not any(role in target_roles for role in user_roles):
                    continue
            
            filtered.append(ann)
        
        return filtered

    async def dismiss_announcement(
        self,
        announcement_id: int,
        user_id: int
    ) -> AnnouncementDismissal:
        """Mark an announcement as dismissed by a user"""
        # Check if already dismissed
        existing = await self.db.execute(
            select(AnnouncementDismissal).where(
                and_(
                    AnnouncementDismissal.announcement_id == announcement_id,
                    AnnouncementDismissal.user_id == user_id
                )
            )
        )
        dismissal = existing.scalar_one_or_none()
        
        if dismissal:
            return dismissal
        
        dismissal = AnnouncementDismissal(
            announcement_id=announcement_id,
            user_id=user_id
        )
        
        self.db.add(dismissal)
        await self.db.commit()
        await self.db.refresh(dismissal)
        
        return dismissal

    async def update_announcement(
        self,
        announcement_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Announcement]:
        """Update an announcement"""
        announcement = await self.get_announcement(announcement_id)
        if not announcement:
            return None
        
        for key, value in updates.items():
            if hasattr(announcement, key) and value is not None:
                if key in ['target_users', 'target_teams', 'target_roles'] and isinstance(value, list):
                    setattr(announcement, key, json.dumps(value))
                else:
                    setattr(announcement, key, value)
        
        await self.db.commit()
        await self.db.refresh(announcement)
        
        return announcement

    async def delete_announcement(self, announcement_id: int) -> bool:
        """Delete an announcement"""
        announcement = await self.get_announcement(announcement_id)
        if not announcement:
            return False
        
        await self.db.delete(announcement)
        await self.db.commit()
        
        return True




