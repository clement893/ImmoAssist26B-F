"""
Load tests for API key operations
"""

import pytest
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.api_key_service import APIKeyService


@pytest.mark.load
@pytest.mark.asyncio
class TestAPIKeyLoad:
    """Load tests for API key operations"""
    
    async def test_concurrent_api_key_creation(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test creating API keys concurrently"""
        async def create_key(index: int):
            return await APIKeyService.create_api_key(
                db=db,
                user=test_user,
                name=f"Concurrent Key {index}",
            )
        
        # Create 50 keys concurrently
        start_time = datetime.utcnow()
        tasks = [create_key(i) for i in range(50)]
        results = await asyncio.gather(*tasks)
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        
        assert len(results) == 50
        # Should complete in under 5 seconds
        assert elapsed < 5.0
        
        # Verify all keys are unique
        key_ids = [r[0].id for r in results]
        assert len(set(key_ids)) == 50
    
    async def test_concurrent_api_key_lookups(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test concurrent API key lookups"""
        # Create a key
        api_key, plaintext_key = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Lookup Test Key",
        )
        
        from app.core.api_key import hash_api_key
        key_hash = hash_api_key(plaintext_key)
        
        async def lookup_key():
            return await APIKeyService.find_api_key_by_hash(db, key_hash)
        
        # Perform 100 concurrent lookups
        start_time = datetime.utcnow()
        tasks = [lookup_key() for _ in range(100)]
        results = await asyncio.gather(*tasks)
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        
        # All should find the key
        assert all(r is not None for r in results)
        assert all(r.id == api_key.id for r in results)
        # Should complete in under 2 seconds
        assert elapsed < 2.0
    
    async def test_concurrent_usage_updates(
        self,
        db: AsyncSession,
        test_user: User,
    ):
        """Test concurrent usage updates"""
        api_key, _ = await APIKeyService.create_api_key(
            db=db,
            user=test_user,
            name="Usage Test Key",
        )
        
        async def update_usage():
            await APIKeyService.update_usage(db, api_key)
        
        # Perform 100 concurrent usage updates
        start_time = datetime.utcnow()
        tasks = [update_usage() for _ in range(100)]
        await asyncio.gather(*tasks)
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        
        await db.refresh(api_key)
        
        # Usage count should be 100
        assert api_key.usage_count == 100
        # Should complete in under 2 seconds
        assert elapsed < 2.0

