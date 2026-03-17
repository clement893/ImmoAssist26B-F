"""
Notification Service
Service for managing user notifications
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType
from app.core.logging import logger


class NotificationService:
    """Service for notification operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Create a new notification"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type.value,
            action_url=action_url,
            action_label=action_label,
            notification_metadata=metadata
        )
        
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        
        logger.info(f"Created notification {notification.id} for user {user_id}")
        return notification

    async def get_notification(
        self,
        notification_id: int,
        user_id: Optional[int] = None
    ) -> Optional[Notification]:
        """Get a notification by ID, optionally filtered by user_id"""
        query = select(Notification).where(Notification.id == notification_id)
        
        if user_id is not None:
            query = query.where(Notification.user_id == user_id)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_notifications(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        read: Optional[bool] = None,
        notification_type: Optional[NotificationType] = None
    ) -> List[Notification]:
        """Get notifications for a user with optional filters"""
        query = select(Notification).where(Notification.user_id == user_id)
        
        if read is not None:
            query = query.where(Notification.read == read)
        
        if notification_type is not None:
            query = query.where(Notification.notification_type == notification_type.value)
        
        query = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications for a user"""
        result = await self.db.execute(
            select(func.count(Notification.id))
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.read == False
                )
            )
        )
        return result.scalar() or 0

    async def mark_as_read(
        self,
        notification_id: int,
        user_id: int
    ) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = await self.get_notification(notification_id, user_id)
        
        if not notification:
            return None
        
        if not notification.read:
            notification.mark_as_read()
            await self.db.commit()
            await self.db.refresh(notification)
            logger.info(f"Marked notification {notification_id} as read for user {user_id}")
        
        return notification

    async def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user"""
        result = await self.db.execute(
            select(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.read == False
                )
            )
        )
        notifications = result.scalars().all()
        
        count = 0
        now = datetime.now(timezone.utc)
        for notification in notifications:
            if not notification.read:
                notification.read = True
                notification.read_at = now
                count += 1
        
        if count > 0:
            await self.db.commit()
            logger.info(f"Marked {count} notifications as read for user {user_id}")
        
        return count

    async def delete_notification(
        self,
        notification_id: int,
        user_id: int
    ) -> bool:
        """Delete a notification (only if it belongs to the user)"""
        notification = await self.get_notification(notification_id, user_id)
        
        if not notification:
            return False
        
        await self.db.delete(notification)
        await self.db.commit()
        
        logger.info(f"Deleted notification {notification_id} for user {user_id}")
        return True

    async def delete_all_read(self, user_id: int) -> int:
        """Delete all read notifications for a user"""
        result = await self.db.execute(
            select(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.read == True
                )
            )
        )
        notifications = result.scalars().all()
        
        count = len(notifications)
        for notification in notifications:
            await self.db.delete(notification)
        
        if count > 0:
            await self.db.commit()
            logger.info(f"Deleted {count} read notifications for user {user_id}")
        
        return count

    async def get_notification_stats(self, user_id: int) -> Dict[str, int]:
        """Get notification statistics for a user"""
        total_result = await self.db.execute(
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id)
        )
        total = total_result.scalar() or 0
        
        unread_count = await self.get_unread_count(user_id)
        read_count = total - unread_count
        
        return {
            "total": total,
            "unread": unread_count,
            "read": read_count
        }

