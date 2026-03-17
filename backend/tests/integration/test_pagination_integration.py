"""
Integration tests for pagination
"""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.pagination import PaginationParams, paginate_query
from app.models.user import User


@pytest.mark.integration
class TestPaginationIntegration:
    """Test pagination with database"""
    
    @pytest.mark.asyncio
    async def test_paginate_query_empty(self, db_session: AsyncSession):
        """Test paginating empty query"""
        query = select(User)
        pagination = PaginationParams(page=1, page_size=20)
        
        result = await paginate_query(db_session, query, pagination)
        
        assert result.total == 0
        assert len(result.items) == 0
        assert result.page == 1
        assert result.page_size == 20
        assert result.total_pages == 0
        assert result.has_next is False
        assert result.has_previous is False
    
    @pytest.mark.asyncio
    async def test_paginate_query_with_data(
        self,
        db_session: AsyncSession,
        test_user_data: dict,
    ):
        """Test paginating query with data"""
        # Create test user
        import bcrypt
        password_bytes = test_user_data["password"].encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        
        user = User(
            email=test_user_data["email"],
            hashed_password=hashed_password,
            first_name=test_user_data["first_name"],
            last_name=test_user_data["last_name"],
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        
        # Paginate
        query = select(User)
        pagination = PaginationParams(page=1, page_size=10)
        
        result = await paginate_query(db_session, query, pagination)
        
        assert result.total >= 1
        assert len(result.items) >= 1
        assert result.page == 1
        assert result.has_previous is False

