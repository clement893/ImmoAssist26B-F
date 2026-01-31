"""Notification tasks."""

from typing import Optional, Dict, Union
from datetime import datetime, timezone
from app.celery_app import celery_app
from app.core.logging import logger
from app.services.email_service import EmailService
from app.models.notification import Notification, NotificationType


@celery_app.task(bind=True, max_retries=3)
def send_notification_task(
    self, 
    user_id: Union[str, int], 
    title: str, 
    message: str,
    notification_type: str = "info",
    email_notification: bool = True,
    user_email: Optional[str] = None,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    metadata: Optional[Dict] = None
):
    """
    Send notification to a user.
    
    Creates a notification in the database, optionally sends email, and sends WebSocket notification.
    
    Args:
        user_id: User ID to send notification to (int or str)
        title: Notification title
        message: Notification message
        notification_type: Type of notification (info, success, warning, error)
        email_notification: Whether to send email notification (default: True)
        user_email: User email address (optional, will be fetched from DB if not provided)
        action_url: Optional action URL for the notification
        action_label: Optional action button label
        metadata: Optional metadata dictionary
    
    Returns:
        Dict with status and details including notification_id
    """
    try:
        from app.core.config import settings
        from app.models.user import User
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Convert user_id to int if it's a string
        user_id_int = int(user_id) if isinstance(user_id, str) else user_id
        
        # Create synchronous engine for Celery (convert async URL to sync)
        sync_db_url = str(settings.DATABASE_URL).replace("+asyncpg", "").replace("postgresql+asyncpg", "postgresql+psycopg2")
        sync_engine = create_engine(
            sync_db_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        SessionLocal = sessionmaker(bind=sync_engine)
        
        # Get database session (synchronous for Celery)
        db = SessionLocal()
        
        result: Dict[str, Union[str, bool, int, None]] = {
            "status": "sent",
            "user_id": user_id_int,
            "title": title,
            "message": message,
            "type": notification_type,
            "notification_id": None,
            "email_sent": False,
            "websocket_sent": False
        }
        
        try:
            # Validate notification type
            try:
                notif_type_enum = NotificationType(notification_type.lower())
            except ValueError:
                logger.warning(f"Invalid notification type '{notification_type}', defaulting to INFO")
                notif_type_enum = NotificationType.INFO
            
            # Create notification in database
            notification = Notification(
                user_id=user_id_int,
                title=title,
                message=message,
                notification_type=notif_type_enum.value,
                action_url=action_url,
                action_label=action_label,
                metadata=metadata
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            result["notification_id"] = notification.id
            logger.info(f"Created notification {notification.id} for user {user_id_int}")
            
            # Get user email if not provided and email notification is enabled
            if email_notification and not user_email:
                user = db.query(User).filter(User.id == user_id_int).first()
                if user:
                    user_email = user.email
                else:
                    logger.warning(f"User {user_id_int} not found, skipping email notification")
                    email_notification = False
        
            # Send email notification if enabled
            if email_notification and user_email:
                try:
                    email_service = EmailService()
                    if email_service.is_configured():
                        # Create HTML email content
                        html_content = f"""
                        <html>
                        <body>
                            <h2>{title}</h2>
                            <p>{message}</p>
                            <p><small>Type: {notification_type}</small></p>
                        </body>
                        </html>
                        """
                        
                        email_result = email_service.send_email(
                            to_email=user_email,
                            subject=f"Notification: {title}",
                            html_content=html_content,
                            text_content=message
                        )
                        result["email_sent"] = True
                        result["email_status"] = email_result.get("status")
                        logger.info(f"Email notification sent to {user_email} for user {user_id_int}")
                    else:
                        logger.warning(f"Email service not configured for user {user_id_int}")
                except Exception as email_error:
                    logger.error(f"Failed to send email notification: {email_error}", exc_info=True)
                    # Don't fail the whole task if email fails
        
            # Send WebSocket notification if user is connected
            # NOTE: This is a best-effort attempt, WebSocket may not be available in Celery context
            # WebSocket connections are managed in the main application context
            try:
                from app.api.v1.endpoints.websocket import manager
                # Try to send via WebSocket (non-blocking)
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # If loop is running, schedule the coroutine
                        asyncio.create_task(manager.send_personal_message({
                            "type": "notification",
                            "data": {
                                "id": notification.id,
                                "title": title,
                                "message": message,
                                "type": notification_type,
                                "user_id": str(user_id_int),
                                "read": False,
                                "created_at": notification.created_at.isoformat() if notification.created_at else None
                            }
                        }, str(user_id_int)))
                    else:
                        # If no loop is running, run the coroutine
                        loop.run_until_complete(manager.send_personal_message({
                            "type": "notification",
                            "data": {
                                "id": notification.id,
                                "title": title,
                                "message": message,
                                "type": notification_type,
                                "user_id": str(user_id_int),
                                "read": False,
                                "created_at": notification.created_at.isoformat() if notification.created_at else None
                            }
                        }, str(user_id_int)))
                    result["websocket_sent"] = True
                    logger.info(f"WebSocket notification sent to user {user_id_int}")
                except RuntimeError:
                    # No event loop available, skip WebSocket
                    logger.debug(f"No event loop available for WebSocket notification to user {user_id_int}")
                    result["websocket_sent"] = False
            except Exception as ws_error:
                logger.warning(f"Failed to send WebSocket notification: {ws_error}")
                result["websocket_sent"] = False
            
            # Log notification
            logger.info(f"Notification sent successfully: user_id={user_id_int}, notification_id={notification.id}, title={title}")
            
            return result
            
        finally:
            db.close()
        
    except Exception as exc:
        logger.error(f"Failed to send notification: {exc}", exc_info=True)
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def send_user_notification(
    user_id: Union[str, int], 
    title: str, 
    message: str,
    notification_type: str = "info",
    email_notification: bool = True
):
    """
    Convenience task to send a user notification.
    
    Args:
        user_id: User ID (int or str)
        title: Notification title
        message: Notification message
        notification_type: Type of notification (default: "info")
        email_notification: Whether to send email (default: True)
    
    Returns:
        Celery task result
    """
    return send_notification_task.delay(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        email_notification=email_notification
    )
