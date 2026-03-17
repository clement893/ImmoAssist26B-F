"""
Notifications API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notification_service import NotificationService
from app.models.user import User
from app.models.notification import NotificationType
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationListResponse,
    NotificationUnreadCountResponse
)
from app.dependencies import get_current_user
from app.core.database import get_db
from app.core.logging import logger

router = APIRouter()


@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"]
)
async def get_notifications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    read: Optional[bool] = Query(None, description="Filter by read status"),
    notification_type: Optional[NotificationType] = Query(None, description="Filter by notification type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationListResponse:
    """
    Get user's notifications with pagination and filtering
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return (1-1000)
    - **read**: Filter by read status (true/false)
    - **notification_type**: Filter by notification type (info/success/warning/error)
    """
    service = NotificationService(db)
    
    notifications = await service.get_user_notifications(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        read=read,
        notification_type=notification_type
    )
    
    unread_count = await service.get_unread_count(current_user.id)
    
    # Convert to response models
    notification_responses = [
        NotificationResponse.model_validate(notification)
        for notification in notifications
    ]
    
    return NotificationListResponse(
        notifications=notification_responses,
        total=len(notification_responses),
        unread_count=unread_count,
        skip=skip,
        limit=limit
    )


@router.get(
    "/notifications/unread-count",
    response_model=NotificationUnreadCountResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"]
)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationUnreadCountResponse:
    """Get count of unread notifications for the current user"""
    service = NotificationService(db)
    unread_count = await service.get_unread_count(current_user.id)
    
    return NotificationUnreadCountResponse(
        unread_count=unread_count,
        user_id=current_user.id
    )


@router.get(
    "/notifications/{notification_id}",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"]
)
async def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    """Get a specific notification by ID (only if it belongs to the current user)"""
    service = NotificationService(db)
    
    notification = await service.get_notification(
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    tags=["notifications"]
)
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    """Mark a notification as read"""
    service = NotificationService(db)
    
    notification = await service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse.model_validate(notification)


@router.patch(
    "/notifications/read-all",
    status_code=status.HTTP_200_OK,
    tags=["notifications"]
)
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark all notifications as read for the current user"""
    service = NotificationService(db)
    
    count = await service.mark_all_as_read(current_user.id)
    
    return {
        "message": f"Marked {count} notifications as read",
        "count": count
    }


@router.delete(
    "/notifications/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["notifications"]
)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a notification (only if it belongs to the current user)"""
    service = NotificationService(db)
    
    deleted = await service.delete_notification(
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )


@router.post(
    "/notifications",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["notifications"]
)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    """
    Create a new notification
    
    Note: Users can only create notifications for themselves.
    Admins can create notifications for other users (to be implemented).
    """
    service = NotificationService(db)
    
    # For now, users can only create notifications for themselves
    if notification_data.user_id != current_user.id:
        # Check if user is admin (simplified check)
        # In production, use proper RBAC check
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create notifications for yourself"
        )
    
    notification = await service.create_notification(
        user_id=notification_data.user_id,
        title=notification_data.title,
        message=notification_data.message,
        notification_type=notification_data.notification_type,
        action_url=notification_data.action_url,
        action_label=notification_data.action_label,
        metadata=notification_data.metadata
    )
    
    return NotificationResponse.model_validate(notification)

