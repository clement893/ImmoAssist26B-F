"""
Share Service
Manages sharing and permissions
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import secrets
import hashlib

from app.models.share import Share, ShareAccessLog, PermissionLevel
from app.core.security import hash_password, verify_password
from app.core.logging import logger


class ShareService:
    """Service for share operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_share(
        self,
        entity_type: str,
        entity_id: int,
        shared_with_type: str,
        shared_with_id: int,
        permission_level: PermissionLevel,
        created_by_id: int,
        expires_at: Optional[datetime] = None,
        requires_password: bool = False,
        password: Optional[str] = None,
        is_public_link: bool = False
    ) -> Share:
        """Create a new share"""
        # Check if share already exists
        existing = await self.db.execute(
            select(Share).where(
                and_(
                    Share.entity_type == entity_type,
                    Share.entity_id == entity_id,
                    Share.shared_with_type == shared_with_type,
                    Share.shared_with_id == shared_with_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Share already exists")

        share_token = None
        password_hash = None
        
        if is_public_link:
            # Generate unique token for public link
            share_token = secrets.token_urlsafe(32)
        
        if requires_password and password:
            password_hash = hash_password(password)

        share = Share(
            entity_type=entity_type,
            entity_id=entity_id,
            shared_with_type=shared_with_type,
            shared_with_id=shared_with_id,
            permission_level=permission_level,
            created_by_id=created_by_id,
            expires_at=expires_at,
            requires_password=requires_password,
            password_hash=password_hash,
            share_token=share_token,
            is_public_link=is_public_link
        )
        
        self.db.add(share)
        await self.db.commit()
        await self.db.refresh(share)
        
        return share

    async def get_shares_for_entity(
        self,
        entity_type: str,
        entity_id: int
    ) -> List[Share]:
        """Get all shares for an entity"""
        result = await self.db.execute(
            select(Share).where(
                and_(
                    Share.entity_type == entity_type,
                    Share.entity_id == entity_id
                )
            ).order_by(desc(Share.created_at))
        )
        return list(result.scalars().all())

    async def get_user_shares(
        self,
        user_id: int,
        entity_type: Optional[str] = None
    ) -> List[Share]:
        """Get all shares for a user (where user is shared with)"""
        query = select(Share).where(
            and_(
                Share.shared_with_type == 'user',
                Share.shared_with_id == user_id
            )
        )
        
        if entity_type:
            query = query.where(Share.entity_type == entity_type)
        
        # Check expiration
        query = query.where(
            or_(
                Share.expires_at.is_(None),
                Share.expires_at > datetime.now(timezone.utc)
            )
        )
        
        result = await self.db.execute(query.order_by(desc(Share.created_at)))
        return list(result.scalars().all())

    async def get_share_by_token(
        self,
        share_token: str
    ) -> Optional[Share]:
        """Get a share by its public token"""
        result = await self.db.execute(
            select(Share).where(
                and_(
                    Share.share_token == share_token,
                    Share.is_public_link == True
                )
            )
        )
        share = result.scalar_one_or_none()
        
        if share and share.expires_at and share.expires_at < datetime.now(timezone.utc):
            return None
        
        return share

    async def check_permission(
        self,
        entity_type: str,
        entity_id: int,
        user_id: int,
        required_permission: PermissionLevel
    ) -> bool:
        """Check if a user has required permission"""
        # Get all shares for this entity
        shares = await self.get_shares_for_entity(entity_type, entity_id)
        
        # Check direct user shares
        for share in shares:
            if share.shared_with_type == 'user' and share.shared_with_id == user_id:
                if self._permission_sufficient(share.permission_level, required_permission):
                    return True
        
        # Check team shares (would need team membership check)
        # For now, just check direct shares
        
        return False

    def _permission_sufficient(
        self,
        user_permission: PermissionLevel,
        required_permission: PermissionLevel
    ) -> bool:
        """Check if user permission is sufficient for required permission"""
        permission_hierarchy = {
            PermissionLevel.VIEW: 1,
            PermissionLevel.COMMENT: 2,
            PermissionLevel.EDIT: 3,
            PermissionLevel.ADMIN: 4,
        }
        return permission_hierarchy.get(user_permission, 0) >= permission_hierarchy.get(required_permission, 0)

    async def update_share(
        self,
        share_id: int,
        permission_level: Optional[PermissionLevel] = None,
        expires_at: Optional[datetime] = None,
        created_by_id: Optional[int] = None
    ) -> Optional[Share]:
        """Update a share"""
        share = await self.db.get(Share, share_id)
        if not share:
            return None
        
        # Check ownership
        if created_by_id and share.created_by_id != created_by_id:
            raise ValueError("User does not have permission to update this share")
        
        if permission_level:
            share.permission_level = permission_level
        if expires_at is not None:
            share.expires_at = expires_at
        
        await self.db.commit()
        await self.db.refresh(share)
        
        return share

    async def delete_share(
        self,
        share_id: int,
        user_id: int
    ) -> bool:
        """Delete a share"""
        share = await self.db.get(Share, share_id)
        if not share:
            return False
        
        # Check ownership
        if share.created_by_id != user_id:
            raise ValueError("User does not have permission to delete this share")
        
        await self.db.delete(share)
        await self.db.commit()
        
        return True

    async def log_access(
        self,
        share_id: int,
        user_id: Optional[int],
        access_type: str,
        success: bool = True,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> ShareAccessLog:
        """Log share access"""
        log = ShareAccessLog(
            share_id=share_id,
            user_id=user_id,
            access_type=access_type,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        
        return log

    async def verify_share_password(
        self,
        share_id: int,
        password: str
    ) -> bool:
        """Verify password for password-protected share"""
        share = await self.db.get(Share, share_id)
        if not share or not share.requires_password:
            return False
        
        if not share.password_hash:
            return False
        
        return verify_password(password, share.password_hash)




