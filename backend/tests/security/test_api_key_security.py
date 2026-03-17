"""
Security tests for API key management
Penetration testing and vulnerability checks
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.api_key_service import APIKeyService
from app.core.api_key import hash_api_key, generate_api_key


@pytest.mark.security
@pytest.mark.asyncio
class TestAPIKeySecurity:
    """Security tests for API key management"""
    
    async def test_api_key_uniqueness(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that API keys are unique"""
        keys = []
        hashes = set()
        
        # Generate 100 keys and verify uniqueness
        for _ in range(100):
            api_key, plaintext_key = await APIKeyService.create_api_key(
                db=db,
                user=test_user,
                name=f"Unique Key {len(keys)}",
            )
            key_hash = hash_api_key(plaintext_key)
            
            assert key_hash not in hashes, "Duplicate API key hash detected"
            hashes.add(key_hash)
            keys.append(api_key)
        
        assert len(keys) == 100
        assert len(hashes) == 100
    
    async def test_api_key_hash_security(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that API keys are properly hashed"""
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Hash Security Test",
        )
        
        # Verify plaintext key is not stored
        assert plaintext_key != api_key.key_hash
        assert len(api_key.key_hash) == 64  # SHA256 hex length
        
        # Verify hash matches
        expected_hash = hash_api_key(plaintext_key)
        assert api_key.key_hash == expected_hash
    
    async def test_cannot_rotate_other_user_key(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that users cannot rotate other users' API keys"""
        # Create another user
        from app.models.user import User
        from app.core.auth import get_password_hash
        
        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db.add(other_user)
        await db.commit()
        await db.refresh(other_user)
        
        # Create API key for other user
        other_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=other_user,
            name="Other User Key",
        )
        
        # Try to rotate as test_user (should fail)
        with pytest.raises(ValueError, match="not found"):
            await APIKeyService.rotate_api_key(
                db=db,
                api_key_id=other_key.id,
                user=test_user,
            )
    
    async def test_cannot_revoke_other_user_key(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that users cannot revoke other users' API keys"""
        # Create another user
        from app.models.user import User
        from app.core.auth import get_password_hash
        
        other_user = User(
            email="other2@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db.add(other_user)
        await db.commit()
        await db.refresh(other_user)
        
        # Create API key for other user
        other_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=other_user,
            name="Other User Key 2",
        )
        
        # Try to revoke as test_user (should fail)
        with pytest.raises(ValueError, match="not found"):
            await APIKeyService.revoke_api_key(
                db=db,
                api_key_id=other_key.id,
                user=test_user,
            )
    
    async def test_revoked_key_cannot_be_used(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that revoked keys cannot be used"""
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Revocation Test Key",
        )
        
        # Revoke key
        await APIKeyService.revoke_api_key(
            db=db,
            api_key_id=api_key.id,
            user=test_user,
        )
        
        await db.refresh(api_key)
        
        # Verify key is invalid
        assert api_key.is_valid() is False
        assert api_key.is_active is False
        
        # Try to find by hash (should not find active key)
        key_hash = hash_api_key(plaintext_key)
        found_key = await APIKeyService.find_api_key_by_hash(db, key_hash)
        assert found_key is None  # Should not find revoked key
    
    async def test_expired_key_cannot_be_used(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that expired keys cannot be used"""
        from datetime import datetime, timedelta
        
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Expiration Test Key",
            expires_in_days=1,
        )
        
        # Manually expire the key
        api_key.expires_at = datetime.utcnow() - timedelta(days=1)
        await db.commit()
        
        await db.refresh(api_key)
        
        # Verify key is invalid
        assert api_key.is_valid() is False
        assert api_key.is_expired() is True
    
    async def test_api_key_entropy(
        self,
    ):
        """Test that API keys have sufficient entropy"""
        keys = []
        
        # Generate multiple keys
        for _ in range(50):
            key = generate_api_key()
            keys.append(key)
        
        # Check length (should be at least 32 characters)
        assert all(len(key) >= 32 for key in keys)
        
        # Check uniqueness
        assert len(set(keys)) == 50
        
        # Check character diversity (should use URL-safe base64)
        for key in keys:
            # Should contain alphanumeric and safe special chars
            assert any(c.isalnum() for c in key)
    
    async def test_rotation_preserves_settings(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test that rotation preserves key settings"""
        original_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Settings Preservation Test",
            description="Test description",
            rotation_policy="90d",
            expires_in_days=365,
        )
        
        # Rotate key
        new_key, _ = await APIKeyService.rotate_api_key(
            db=db,
            api_key_id=original_key.id,
            user=test_user,
        )
        
        # Verify settings are preserved
        assert new_key.rotation_policy == original_key.rotation_policy
        assert new_key.user_id == original_key.user_id
        # Description should be updated to indicate rotation
        assert "rotated" in new_key.name.lower()

