"""
Comprehensive Tests for Pagination Utilities
"""

import pytest
from unittest.mock import AsyncMock, Mock
from app.core.pagination import (
    PaginationParams,
    PaginatedResponse,
    paginate_query,
)


class TestPaginationParams:
    """Tests for PaginationParams"""
    
    def test_pagination_params_defaults(self):
        """Test pagination params with defaults"""
        params = PaginationParams()
        assert params.page == 1
        assert params.page_size == 20
    
    def test_pagination_params_custom(self):
        """Test pagination params with custom values"""
        params = PaginationParams(page=2, page_size=50)
        assert params.page == 2
        assert params.page_size == 50
        assert params.offset == 50  # (2-1) * 50
        assert params.limit == 50
    
    def test_pagination_params_offset_calculation(self):
        """Test offset calculation"""
        params = PaginationParams(page=3, page_size=10)
        assert params.offset == 20  # (3-1) * 10


class TestPaginatedResponse:
    """Tests for PaginatedResponse"""
    
    def test_paginated_response_creation(self):
        """Test creating paginated response"""
        items = [1, 2, 3]
        response = PaginatedResponse.create(
            items=items,
            total=100,
            page=1,
            page_size=10
        )
        
        assert response.items == items
        assert response.total == 100
        assert response.page == 1
        assert response.page_size == 10
        assert response.has_next is True
        assert response.has_previous is False
    
    def test_paginated_response_no_more(self):
        """Test paginated response when no more items"""
        items = [1, 2, 3]
        response = PaginatedResponse.create(
            items=items,
            total=3,
            page=1,
            page_size=10
        )
        
        assert response.has_next is False
        assert response.total_pages == 1
    
    def test_paginated_response_calculation(self):
        """Test paginated response calculations"""
        response = PaginatedResponse.create(
            items=[1, 2, 3],
            total=100,
            page=2,
            page_size=10
        )
        
        assert response.page == 2
        assert response.page_size == 10
        assert response.total_pages == 10
        assert response.has_next is True
        assert response.has_previous is True


class TestPaginateQuery:
    """Tests for paginate_query function"""
    
    @pytest.mark.asyncio
    async def test_paginate_query(self):
        """Test paginating a query"""
        from sqlalchemy import select
        from sqlalchemy.ext.asyncio import AsyncSession
        
        # Mock session and query
        mock_session = AsyncMock(spec=AsyncSession)
        mock_query = Mock()
        
        # Mock count query result
        mock_count_result = Mock()
        mock_count_result.scalar_one.return_value = 100
        mock_session.execute = AsyncMock(return_value=mock_count_result)
        
        # Mock items query result
        mock_items_result = Mock()
        mock_items_result.scalars.return_value.all.return_value = [1, 2, 3]
        
        # Setup execute to return different results for count vs items
        async def execute_side_effect(query):
            if 'count' in str(query).lower() or 'func.count' in str(query):
                return mock_count_result
            return mock_items_result
        
        mock_session.execute = AsyncMock(side_effect=execute_side_effect)
        
        pagination = PaginationParams(page=1, page_size=10)
        result = await paginate_query(mock_session, mock_query, pagination)
        
        assert result.total == 100
        assert len(result.items) == 3
        assert result.page == 1
        assert result.page_size == 10


class TestCreatePaginationLinks:
    """Tests for create_pagination_links function"""
    
    def test_create_pagination_links_first_page(self):
        """Test creating pagination links for first page"""
        from app.core.pagination import create_pagination_links
        
        links = create_pagination_links(
            base_url="/api/v1/users",
            page=1,
            page_size=10,
            total_pages=10
        )
        
        assert "first" in links
        assert "last" in links
        assert "next" in links
        assert "prev" not in links
    
    def test_create_pagination_links_middle_page(self):
        """Test creating pagination links for middle page"""
        from app.core.pagination import create_pagination_links
        
        links = create_pagination_links(
            base_url="/api/v1/users",
            page=5,
            page_size=10,
            total_pages=10
        )
        
        assert "first" in links
        assert "last" in links
        assert "next" in links
        assert "prev" in links
    
    def test_create_pagination_links_last_page(self):
        """Test creating pagination links for last page"""
        from app.core.pagination import create_pagination_links
        
        links = create_pagination_links(
            base_url="/api/v1/users",
            page=10,
            page_size=10,
            total_pages=10
        )
        
        assert "first" in links
        assert "last" in links
        assert "next" not in links
        assert "prev" in links

