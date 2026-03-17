"""
API Key Rotation Background Task
Automatically checks and rotates API keys based on rotation policies
"""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import logger
from app.services.api_key_service import APIKeyService
from app.core.security_audit import SecurityAuditLogger, SecurityEventType


async def check_and_rotate_api_keys() -> None:
    """
    Background task to check for API keys that need rotation
    
    This should be called periodically (e.g., daily via cron job or Celery)
    """
    async for db in get_db():
        try:
            # Find keys that need rotation
            keys_needing_rotation = await APIKeyService.check_and_rotate_expired_keys(db)
            
            if not keys_needing_rotation:
                logger.info("No API keys need rotation")
                return
            
            logger.info(
                f"Found {len(keys_needing_rotation)} API keys needing rotation",
                context={"key_ids": [k.id for k in keys_needing_rotation]}
            )
            
            # For each key, notify user (don't auto-rotate - let user initiate)
            for key in keys_needing_rotation:
                # Log that rotation is needed
                await SecurityAuditLogger.log_event(
                    db=db,
                    event_type=SecurityEventType.API_KEY_EXPIRED,
                    description=f"API key '{key.name}' (ID: {key.id}) needs rotation",
                    user_id=key.user_id,
                    severity="warning",
                    success="unknown",
                    metadata={
                        "api_key_id": key.id,
                        "rotation_policy": key.rotation_policy,
                        "next_rotation_at": key.next_rotation_at.isoformat() if key.next_rotation_at else None,
                    }
                )
                
                logger.warning(
                    f"API key {key.id} needs rotation",
                    context={
                        "api_key_id": key.id,
                        "user_id": key.user_id,
                        "rotation_policy": key.rotation_policy,
                    }
                )
            
        except Exception as e:
            logger.error(
                "Error checking API key rotations",
                exc_info=e,
                context={"error": str(e)}
            )
        finally:
            await db.close()

