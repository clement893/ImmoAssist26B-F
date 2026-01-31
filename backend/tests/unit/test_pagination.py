"""
Unit tests for pagination utilities
"""

import pytest
from app.core.pagination import PaginationParams, PaginatedResponse


class TestPaginationParams:
    """Test PaginationParams model"""
    
    def test_default_values(self):
        """Test default pagination parameters"""
        params = PaginationParams()
        assert params.page == 1
        assert params.page_size == 20
        assert params.offset == 0
        assert params.limit == 20
    
    def test_custom_values(self):
        """Test custom pagination parameters"""
        params = PaginationParams(page=2, page_size=10)
        assert params.page == 2
        assert params.page_size == 10
        assert params.offset == 10
        assert params.limit == 10
    
    def test_offset_calculation(self):
        """Test offset calculation"""
        params = PaginationParams(page=3, page_size=15)
        assert params.offset == 30  # (3-1) * 15
    
    def test_minimum_values(self):
        """Test minimum value constraints"""
        params = PaginationParams(page=1, page_size=1)
        assert params.page == 1
        assert params.page_size == 1
    
    def test_maximum_page_size(self):
        """Test maximum page size constraint"""
        with pytest.raises(Exception):  # Should raise validation error
            PaginationParams(page_size=101)


class TestPaginatedResponse:
    """Test PaginatedResponse model"""
    
    def test_create_response(self):
        """Test creating paginated response"""
        items = [1, 2, 3, 4, 5]
        response = PaginatedResponse.create(
            items=items,
            total=50,
            page=1,
            page_size=20,
        )
        
        assert response.items == items
        assert response.total == 50
        assert response.page == 1
        assert response.page_size == 20
        assert response.total_pages == 3  # ceil(50/20)
        assert response.has_next is True
        assert response.has_previous is False
    
    def test_last_page(self):
        """Test last page response"""
        items = [1, 2, 3]
        response = PaginatedResponse.create(
            items=items,
            total=50,
            page=3,
            page_size=20,
        )
        
        assert response.has_next is False
        assert response.has_previous is True
    
    def test_empty_results(self):
        """Test empty results"""
        response = PaginatedResponse.create(
            items=[],
            total=0,
            page=1,
            page_size=20,
        )
        
        assert response.total == 0
        assert response.total_pages == 0
        assert response.has_next is False
        assert response.has_previous is False
    
    def test_single_page(self):
        """Test single page results"""
        items = [1, 2, 3]
        response = PaginatedResponse.create(
            items=items,
            total=3,
            page=1,
            page_size=20,
        )
        
        assert response.total_pages == 1
        assert response.has_next is False
        assert response.has_previous is False

