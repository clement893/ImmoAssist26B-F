"""
API Key Service
Manages API key lifecycle including rotation policies
"""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.api_key import generate_api_key, hash_api_key
from app.core.logging import logger
from app.models.api_key import APIKey
from app.models.user import User


class APIKeyRotationPolicy:
    """API Key rotation policy configuration"""
    
    # Rotation intervals in days
    POLICIES = {
        "manual": None,  # No automatic rotation
        "30d": 30,
        "60d": 60,
        "90d": 90,
        "180d": 180,
        "365d": 365,
    }
    
    @classmethod
    def get_rotation_days(cls, policy: str) -> Optional[int]:
        """Get rotation interval in days for a policy"""
        return cls.POLICIES.get(policy)
    
    @classmethod
    def calculate_next_rotation(cls, policy: str, last_rotated: Optional[datetime] = None) -> Optional[datetime]:
        """Calculate next rotation date based on policy"""
        days = cls.get_rotation_days(policy)
        if not days:
            return None
        
        base_date = last_rotated or datetime.utcnow()
        return base_date + timedelta(days=days)
    
    @classmethod
    def is_valid_policy(cls, policy: str) -> bool:
        """Check if rotation policy is valid"""
        return policy in cls.POLICIES


class APIKeyService:
    """Service for managing API keys"""
    
    @staticmethod
    async def create_api_key(
        db: AsyncSession,
        user: User,
        name: str,
        description: Optional[str] = None,
        rotation_policy: str = "manual",
        expires_in_days: Optional[int] = None,
    ) -> tuple[APIKey, str]:
        """
        Create a new API key
        
        Returns:
            Tuple of (APIKey model, plaintext key)
        """
        # Generate API key
        plaintext_key = generate_api_key()
        key_hash = hash_api_key(plaintext_key)
        key_prefix = f"sk_live_{plaintext_key[:8]}"
        
        # Calculate expiration
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Calculate next rotation
        next_rotation_at = APIKeyRotationPolicy.calculate_next_rotation(rotation_policy)
        
        # Create API key record
        api_key = APIKey(
            user_id=user.id,
            name=name,
            description=description,
            key_hash=key_hash,
            key_prefix=key_prefix,
            rotation_policy=rotation_policy,
            next_rotation_at=next_rotation_at,
            expires_at=expires_at,
            is_active=True,
        )
        
        db.add(api_key)
        await db.commit()
        await db.refresh(api_key)
        
        logger.info(
            "API key created",
            context={
                "api_key_id": api_key.id,
                "user_id": user.id,
                "rotation_policy": rotation_policy,
            }
        )
        
        return api_key, plaintext_key
    
    @staticmethod
    async def rotate_api_key(
        db: AsyncSession,
        api_key_id: int,
        user: User,
    ) -> tuple[APIKey, str]:
        """
        Rotate an API key (create new key, deactivate old one)
        
        Returns:
            Tuple of (new APIKey model, plaintext key)
        """
        # Get existing key
        result = await db.execute(
            select(APIKey).where(
                and_(
                    APIKey.id == api_key_id,
                    APIKey.user_id == user.id,
                )
            )
        )
        old_key = result.scalar_one_or_none()
        
        if not old_key:
            raise ValueError("API key not found")
        
        if not old_key.is_active:
            raise ValueError("Cannot rotate inactive API key")
        
        # Deactivate old key
        old_key.is_active = False
        old_key.revoked_at = datetime.utcnow()
        old_key.revoked_reason = "Rotated to new key"
        
        # Create new key with same settings
        new_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=user,
            name=f"{old_key.name} (rotated)",
            description=old_key.description,
            rotation_policy=old_key.rotation_policy,
            expires_in_days=None,  # Use policy-based expiration
        )
        
        # Update rotation tracking
        new_key.last_rotated_at = datetime.utcnow()
        new_key.rotation_count = old_key.rotation_count + 1
        
        # Copy expiration if old key had one
        if old_key.expires_at:
            days_remaining = (old_key.expires_at - datetime.utcnow()).days
            if days_remaining > 0:
                new_key.expires_at = datetime.utcnow() + timedelta(days=days_remaining)
        
        await db.commit()
        await db.refresh(new_key)
        
        logger.info(
            "API key rotated",
            context={
                "old_api_key_id": old_key.id,
                "new_api_key_id": new_key.id,
                "user_id": user.id,
            }
        )
        
        return new_key, plaintext_key
    
    @staticmethod
    async def revoke_api_key(
        db: AsyncSession,
        api_key_id: int,
        user: User,
        reason: Optional[str] = None,
    ) -> APIKey:
        """Revoke an API key"""
        result = await db.execute(
            select(APIKey).where(
                and_(
                    APIKey.id == api_key_id,
                    APIKey.user_id == user.id,
                )
            )
        )
        api_key = result.scalar_one_or_none()
        
        if not api_key:
            raise ValueError("API key not found")
        
        api_key.is_active = False
        api_key.revoked_at = datetime.utcnow()
        api_key.revoked_reason = reason or "Revoked by user"
        
        await db.commit()
        await db.refresh(api_key)
        
        logger.info(
            "API key revoked",
            context={
                "api_key_id": api_key.id,
                "user_id": user.id,
                "reason": reason,
            }
        )
        
        return api_key
    
    @staticmethod
    async def update_usage(
        db: AsyncSession,
        api_key: APIKey,
    ) -> None:
        """Update API key usage statistics"""
        api_key.last_used_at = datetime.utcnow()
        api_key.usage_count += 1
        await db.commit()
    
    @staticmethod
    async def get_user_api_keys(
        db: AsyncSession,
        user: User,
        include_inactive: bool = False,
    ) -> List[APIKey]:
        """Get all API keys for a user"""
        conditions = [APIKey.user_id == user.id]
        
        if not include_inactive:
            conditions.append(APIKey.is_active == True)
        
        result = await db.execute(
            select(APIKey)
            .where(and_(*conditions))
            .order_by(APIKey.created_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def find_api_key_by_hash(
        db: AsyncSession,
        key_hash: str,
    ) -> Optional[APIKey]:
        """Find API key by hash"""
        result = await db.execute(
            select(APIKey).where(
                and_(
                    APIKey.key_hash == key_hash,
                    APIKey.is_active == True,
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def check_and_rotate_expired_keys(
        db: AsyncSession,
    ) -> List[APIKey]:
        """
        Check for keys that need rotation and mark them for rotation
        
        This should be called periodically (e.g., via cron job)
        """
        now = datetime.utcnow()
        
        # Find keys that need rotation
        result = await db.execute(
            select(APIKey).where(
                and_(
                    APIKey.is_active == True,
                    APIKey.next_rotation_at <= now,
                    APIKey.next_rotation_at.isnot(None),
                )
            )
        )
        keys_needing_rotation = list(result.scalars().all())
        
        logger.info(
            "Found keys needing rotation",
            context={
                "count": len(keys_needing_rotation),
                "key_ids": [k.id for k in keys_needing_rotation],
            }
        )
        
        return keys_needing_rotation

