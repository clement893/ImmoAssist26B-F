"""
Performance tests for API key operations
"""

import pytest
import time
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.api_key_service import APIKeyService
from app.core.security_audit import SecurityAuditLogger, SecurityEventType


@pytest.mark.performance
@pytest.mark.asyncio
class TestAPIKeyPerformance:
    """Performance tests for API key operations"""
    
    async def test_create_api_key_performance(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test API key creation performance"""
        start_time = time.time()
        
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Performance Test Key",
        )
        
        elapsed = time.time() - start_time
        
        # Should complete in under 100ms
        assert elapsed < 0.1
        assert api_key.id is not None
    
    async def test_bulk_api_key_creation(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test creating multiple API keys"""
        start_time = time.time()
        
        keys = []
        for i in range(10):
            key, _ = await APIKeyService.create_api_key(
                db=db,
                user=test_user,
                name=f"Bulk Key {i}",
            )
            keys.append(key)
        
        elapsed = time.time() - start_time
        
        # 10 keys should be created in under 1 second
        assert elapsed < 1.0
        assert len(keys) == 10
    
    async def test_find_api_key_by_hash_performance(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test API key lookup performance"""
        # Create key
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Lookup Test Key",
        )
        
        from app.core.api_key import hash_api_key
        key_hash = hash_api_key(plaintext_key)
        
        # Measure lookup time
        start_time = time.time()
        found_key = await APIKeyService.find_api_key_by_hash(db, key_hash)
        elapsed = time.time() - start_time
        
        # Should find in under 50ms
        assert elapsed < 0.05
        assert found_key is not None
        assert found_key.id == api_key.id
    
    async def test_audit_logging_performance(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test audit logging performance"""
        start_time = time.time()
        
        # Log multiple events
        for i in range(100):
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.LOGIN_SUCCESS,
                description=f"Performance test event {i}",
                user_id=test_user.id,
            )
        
        elapsed = time.time() - start_time
        
        # 100 events should be logged in under 2 seconds
        assert elapsed < 2.0
    
    async def test_rotation_performance(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test API key rotation performance"""
        # Create key
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Rotation Performance Key",
        )
        
        start_time = time.time()
        
        new_key, _ = await APIKeyService.rotate_api_key(
            db=db,
            api_key_id=api_key.id,
            user=test_user,
        )
        
        elapsed = time.time() - start_time
        
        # Rotation should complete in under 200ms
        assert elapsed < 0.2
        assert new_key.id is not None

