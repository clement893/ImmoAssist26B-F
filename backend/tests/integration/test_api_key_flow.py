"""
Integration tests for API key management flow
Tests the complete flow from creation to rotation to revocation
"""

import pytest
from datetime import datetime, timedelta
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.api_key import APIKey
from app.services.api_key_service import APIKeyService
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.api_key import hash_api_key


@pytest.mark.integration
@pytest.mark.asyncio
class TestAPIKeyManagementFlow:
    """Integration tests for API key management"""
    
    async def test_create_and_use_api_key_flow(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test complete flow: create, use, rotate, revoke"""
        # 1. Create API key
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Integration Test Key",
            description="Test key for integration tests",
            rotation_policy="90d",
            expires_in_days=365,
        )
        
        assert api_key.is_active is True
        assert api_key.is_valid() is True
        
        # Verify audit log was created
        from app.core.security_audit import SecurityAuditLog
        from sqlalchemy import select
        
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == api_key.id)
            .where(SecurityAuditLog.event_type == "api_key_created")
        )
        audit_log = result.scalar_one_or_none()
        assert audit_log is not None
        
        # 2. Use API key (simulate authentication)
        key_hash = hash_api_key(plaintext_key)
        found_key = await APIKeyService.find_api_key_by_hash(db, key_hash)
        assert found_key is not None
        assert found_key.id == api_key.id
        
        # Update usage
        await APIKeyService.update_usage(db, found_key)
        await db.refresh(found_key)
        assert found_key.usage_count == 1
        assert found_key.last_used_at is not None
        
        # Verify usage was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == api_key.id)
            .where(SecurityAuditLog.event_type == "api_key_used")
        )
        usage_log = result.scalar_one_or_none()
        assert usage_log is not None
        
        # 3. Rotate API key
        new_key, new_plaintext = await APIKeyService.rotate_api_key(
            db=db,
            api_key_id=api_key.id,
            user=test_user,
        )
        
        # Verify old key is deactivated
        await db.refresh(api_key)
        assert api_key.is_active is False
        
        # Verify new key works
        new_key_hash = hash_api_key(new_plaintext)
        found_new_key = await APIKeyService.find_api_key_by_hash(db, new_key_hash)
        assert found_new_key is not None
        assert found_new_key.id == new_key.id
        
        # Verify rotation was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == new_key.id)
            .where(SecurityAuditLog.event_type == "api_key_rotated")
        )
        rotation_log = result.scalar_one_or_none()
        assert rotation_log is not None
        
        # 4. Revoke new key
        await APIKeyService.revoke_api_key(
            db=db,
            api_key_id=new_key.id,
            user=test_user,
            reason="Test completion",
        )
        
        await db.refresh(new_key)
        assert new_key.is_active is False
        assert new_key.revoked_at is not None
        
        # Verify revocation was logged
        result = await db.execute(
            select(SecurityAuditLog)
            .where(SecurityAuditLog.api_key_id == new_key.id)
            .where(SecurityAuditLog.event_type == "api_key_revoked")
        )
        revoke_log = result.scalar_one_or_none()
        assert revoke_log is not None
    
    async def test_api_key_rotation_policy_enforcement(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that rotation policies are enforced"""
        # Create key with 30d rotation policy
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="30d Rotation Key",
            rotation_policy="30d",
        )
        
        assert api_key.next_rotation_at is not None
        
        # Calculate expected rotation date
        expected_date = api_key.created_at + timedelta(days=30)
        assert abs((api_key.next_rotation_at - expected_date).total_seconds()) < 60  # Within 1 minute
        
        # Check if rotation is needed (should be False initially)
        assert api_key.needs_rotation() is False
        
        # Manually set rotation date to past
        api_key.next_rotation_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        
        # Now should need rotation
        assert api_key.needs_rotation() is True
    
    async def test_api_key_expiration(self, db: AsyncSession, test_user: User):
        """Test API key expiration"""
        # Create key with expiration
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Expiring Key",
            expires_in_days=30,
        )
        
        assert api_key.expires_at is not None
        assert api_key.is_expired() is False
        assert api_key.is_valid() is True
        
        # Set expiration to past
        api_key.expires_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        
        assert api_key.is_expired() is True
        assert api_key.is_valid() is False
    
    async def test_multiple_api_keys_per_user(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test user can have multiple API keys"""
        # Create multiple keys
        key1, _ = await APIKeyService.create_api_key(db, test_user, "Key 1")
        key2, _ = await APIKeyService.create_api_key(db, test_user, "Key 2")
        key3, _ = await APIKeyService.create_api_key(db, test_user, "Key 3")
        
        # Get all keys
        all_keys = await APIKeyService.get_user_api_keys(db, test_user)
        assert len(all_keys) == 3
        
        # Revoke one
        await APIKeyService.revoke_api_key(db, key2.id, test_user)
        
        # Get active keys only
        active_keys = await APIKeyService.get_user_api_keys(db, test_user, include_inactive=False)
        assert len(active_keys) == 2
        assert all(k.id != key2.id for k in active_keys)

