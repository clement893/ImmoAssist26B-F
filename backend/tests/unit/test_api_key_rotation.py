"""
Unit tests for API key rotation service
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import APIKey
from app.models.user import User
from app.services.api_key_service import APIKeyService, APIKeyRotationPolicy
from app.core.api_key import hash_api_key


@pytest.mark.unit
class TestAPIKeyRotationPolicy:
    """Test API key rotation policy configuration"""
    
    def test_get_rotation_days(self):
        """Test getting rotation days for policies"""
        assert APIKeyRotationPolicy.get_rotation_days("manual") is None
        assert APIKeyRotationPolicy.get_rotation_days("30d") == 30
        assert APIKeyRotationPolicy.get_rotation_days("60d") == 60
        assert APIKeyRotationPolicy.get_rotation_days("90d") == 90
        assert APIKeyRotationPolicy.get_rotation_days("180d") == 180
        assert APIKeyRotationPolicy.get_rotation_days("365d") == 365
    
    def test_is_valid_policy(self):
        """Test policy validation"""
        assert APIKeyRotationPolicy.is_valid_policy("manual") is True
        assert APIKeyRotationPolicy.is_valid_policy("30d") is True
        assert APIKeyRotationPolicy.is_valid_policy("invalid") is False
    
    def test_calculate_next_rotation(self):
        """Test next rotation date calculation"""
        base_date = datetime(2025, 1, 1)
        
        # Manual policy - no rotation
        assert APIKeyRotationPolicy.calculate_next_rotation("manual", base_date) is None
        
        # 30d policy
        next_30d = APIKeyRotationPolicy.calculate_next_rotation("30d", base_date)
        assert next_30d == base_date + timedelta(days=30)
        
        # 90d policy
        next_90d = APIKeyRotationPolicy.calculate_next_rotation("90d", base_date)
        assert next_90d == base_date + timedelta(days=90)
        
        # Without base date - uses current time
        next_now = APIKeyRotationPolicy.calculate_next_rotation("30d")
        assert next_now is not None
        assert next_now > datetime.utcnow()


@pytest.mark.unit
@pytest.mark.asyncio
class TestAPIKeyService:
    """Test API key service"""
    
    async def test_create_api_key(self, db: AsyncSession, test_user: User):
        """Test creating an API key"""
        api_key_model, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Test API Key",
            description="Test description",
            rotation_policy="90d",
            expires_in_days=365,
        )
        
        assert api_key_model.id is not None
        assert api_key_model.user_id == test_user.id
        assert api_key_model.name == "Test API Key"
        assert api_key_model.rotation_policy == "90d"
        assert api_key_model.is_active is True
        assert api_key_model.expires_at is not None
        assert api_key_model.next_rotation_at is not None
        
        # Verify key hash matches
        assert hash_api_key(plaintext_key) == api_key_model.key_hash
    
    async def test_create_api_key_manual_rotation(self, db: AsyncSession, test_user: User):
        """Test creating API key with manual rotation policy"""
        api_key_model, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Manual Key",
            rotation_policy="manual",
        )
        
        assert api_key_model.rotation_policy == "manual"
        assert api_key_model.next_rotation_at is None
    
    async def test_rotate_api_key(self, db: AsyncSession, test_user: User):
        """Test rotating an API key"""
        # Create initial key
        old_key, old_plaintext = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Original Key",
            rotation_policy="90d",
        )
        
        old_key_id = old_key.id
        old_rotation_count = old_key.rotation_count
        
        # Rotate key
        new_key, new_plaintext = await APIKeyService.rotate_api_key(
            db=db,
            api_key_id=old_key_id,
            user=test_user,
        )
        
        # Verify old key is deactivated
        await db.refresh(old_key)
        assert old_key.is_active is False
        assert old_key.revoked_at is not None
        assert old_key.revoked_reason == "Rotated to new key"
        
        # Verify new key
        assert new_key.id != old_key_id
        assert new_key.is_active is True
        assert new_key.rotation_count == old_rotation_count + 1
        assert new_key.last_rotated_at is not None
        assert new_plaintext != old_plaintext
    
    async def test_rotate_api_key_not_found(self, db: AsyncSession, test_user: User):
        """Test rotating non-existent API key"""
        with pytest.raises(ValueError, match="not found"):
            await APIKeyService.rotate_api_key(
                db=db,
                api_key_id=99999,
                user=test_user,
            )
    
    async def test_rotate_inactive_key(self, db: AsyncSession, test_user: User):
        """Test rotating inactive API key"""
        # Create and deactivate key
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Inactive Key",
        )
        await APIKeyService.revoke_api_key(db, api_key.id, test_user)
        
        # Try to rotate
        with pytest.raises(ValueError, match="inactive"):
            await APIKeyService.rotate_api_key(
                db=db,
                api_key_id=api_key.id,
                user=test_user,
            )
    
    async def test_revoke_api_key(self, db: AsyncSession, test_user: User):
        """Test revoking an API key"""
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Key to Revoke",
        )
        
        revoked_key = await APIKeyService.revoke_api_key(
            db=db,
            api_key_id=api_key.id,
            user=test_user,
            reason="Security breach",
        )
        
        assert revoked_key.is_active is False
        assert revoked_key.revoked_at is not None
        assert revoked_key.revoked_reason == "Security breach"
    
    async def test_update_usage(self, db: AsyncSession, test_user: User):
        """Test updating API key usage"""
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Usage Test Key",
        )
        
        initial_count = api_key.usage_count
        initial_last_used = api_key.last_used_at
        
        await APIKeyService.update_usage(db, api_key)
        
        await db.refresh(api_key)
        assert api_key.usage_count == initial_count + 1
        assert api_key.last_used_at is not None
        assert api_key.last_used_at != initial_last_used
    
    async def test_get_user_api_keys(self, db: AsyncSession, test_user: User):
        """Test getting user's API keys"""
        # Create multiple keys
        key1, _ = await APIKeyService.create_api_key(db, test_user, "Key 1")
        key2, _ = await APIKeyService.create_api_key(db, test_user, "Key 2")
        
        # Revoke one
        await APIKeyService.revoke_api_key(db, key2.id, test_user)
        
        # Get active keys only
        active_keys = await APIKeyService.get_user_api_keys(db, test_user, include_inactive=False)
        assert len(active_keys) == 1
        assert active_keys[0].id == key1.id
        
        # Get all keys
        all_keys = await APIKeyService.get_user_api_keys(db, test_user, include_inactive=True)
        assert len(all_keys) == 2
    
    async def test_find_api_key_by_hash(self, db: AsyncSession, test_user: User):
        """Test finding API key by hash"""
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Hash Test Key",
        )
        
        key_hash = hash_api_key(plaintext_key)
        found_key = await APIKeyService.find_api_key_by_hash(db, key_hash)
        
        assert found_key is not None
        assert found_key.id == api_key.id
    
    async def test_check_and_rotate_expired_keys(self, db: AsyncSession, test_user: User):
        """Test checking for keys needing rotation"""
        # Create key with past rotation date
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Expired Rotation Key",
            rotation_policy="30d",
        )
        
        # Manually set next_rotation_at to past
        api_key.next_rotation_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        
        # Check for keys needing rotation
        keys_needing_rotation = await APIKeyService.check_and_rotate_expired_keys(db)
        
        assert len(keys_needing_rotation) >= 1
        assert any(k.id == api_key.id for k in keys_needing_rotation)


@pytest.mark.unit
@pytest.mark.asyncio
class TestAPIKeyModel:
    """Test API key model methods"""
    
    async def test_is_expired(self, db: AsyncSession, test_user: User):
        """Test API key expiration check"""
        # Key without expiration
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="No Expiration",
        )
        assert api_key.is_expired() is False
        
        # Key with future expiration
        api_key2, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Future Expiration",
            expires_in_days=30,
        )
        assert api_key2.is_expired() is False
        
        # Key with past expiration
        api_key3, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Past Expiration",
        )
        api_key3.expires_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        assert api_key3.is_expired() is True
    
    async def test_needs_rotation(self, db: AsyncSession, test_user: User):
        """Test API key rotation need check"""
        # Key without rotation policy
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Manual Policy",
            rotation_policy="manual",
        )
        assert api_key.needs_rotation() is False
        
        # Key with future rotation
        api_key2, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Future Rotation",
            rotation_policy="30d",
        )
        assert api_key2.needs_rotation() is False
        
        # Key needing rotation
        api_key3, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Needs Rotation",
            rotation_policy="30d",
        )
        api_key3.next_rotation_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        assert api_key3.needs_rotation() is True
    
    async def test_is_valid(self, db: AsyncSession, test_user: User):
        """Test API key validity check"""
        # Valid key
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Valid Key",
        )
        assert api_key.is_valid() is True
        
        # Revoked key
        await APIKeyService.revoke_api_key(db, api_key.id, test_user)
        await db.refresh(api_key)
        assert api_key.is_valid() is False
        
        # Expired key
        api_key2, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Expired Key",
        )
        api_key2.expires_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        assert api_key2.is_valid() is False

