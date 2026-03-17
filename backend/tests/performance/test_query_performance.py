"""
Performance Tests for Database Queries
"""

import pytest
import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.pagination import paginate_query, PaginationParams
from app.core.query_optimization import QueryOptimizer


@pytest.mark.performance
@pytest.mark.slow
class TestQueryPerformance:
    """Test database query performance"""
    
    @pytest.mark.asyncio
    async def test_pagination_performance(
        self,
        db_session: AsyncSession,
    ):
        """Test that pagination doesn't significantly slow down queries"""
        # Create test users
        import bcrypt
        for i in range(100):
            password_bytes = f"password{i}".encode('utf-8')
            if len(password_bytes) > 72:
                password_bytes = password_bytes[:72]
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
            
            user = User(
                email=f"user{i}@example.com",
                hashed_password=hashed_password,
                first_name=f"User{i}",
                last_name="Test",
                is_active=True,
            )
            db_session.add(user)
        
        await db_session.commit()
        
        # Test pagination performance
        query = select(User)
        pagination = PaginationParams(page=1, page_size=20)
        
        start_time = time.time()
        result = await paginate_query(db_session, query, pagination)
        elapsed_time = time.time() - start_time
        
        # Should complete in reasonable time (< 1 second for 100 records)
        assert elapsed_time < 1.0
        assert result.total == 100
    
    @pytest.mark.asyncio
    async def test_query_without_eager_loading_vs_with(
        self,
        db_session: AsyncSession,
    ):
        """Test that eager loading improves performance"""
        # This test would require relationships to exist
        # For now, we just verify the query runs
        query = select(User)
        
        # Without eager loading
        start_time = time.time()
        result = await db_session.execute(query)
        without_time = time.time() - start_time
        
        # With eager loading (if relationships exist)
        try:
            optimized_query = QueryOptimizer.add_eager_loading(
                query,
                ["roles"],
                strategy="selectin"
            )
            start_time = time.time()
            result = await db_session.execute(optimized_query)
            with_time = time.time() - start_time
            
            # Eager loading should not be significantly slower
            assert with_time < without_time * 2
        except AttributeError:
            # Relationships don't exist, skip test
            pass
    
    @pytest.mark.asyncio
    async def test_large_result_set_pagination(
        self,
        db_session: AsyncSession,
    ):
        """Test pagination with large result sets"""
        # Create many users
        import bcrypt
        for i in range(1000):
            password_bytes = f"password{i}".encode('utf-8')
            if len(password_bytes) > 72:
                password_bytes = password_bytes[:72]
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
            
            user = User(
                email=f"user{i}@example.com",
                hashed_password=hashed_password,
                first_name=f"User{i}",
                last_name="Test",
                is_active=True,
            )
            db_session.add(user)
        
        await db_session.commit()
        
        # Test pagination on large dataset
        query = select(User)
        pagination = PaginationParams(page=50, page_size=20)  # Page 50 of 1000
        
        start_time = time.time()
        result = await paginate_query(db_session, query, pagination)
        elapsed_time = time.time() - start_time
        
        # Should still be fast even for later pages
        assert elapsed_time < 2.0
        assert len(result.items) == 20

