"""
Comprehensive Pagination Tests
Covers all pagination scenarios
"""

import pytest
from app.core.pagination import PaginationParams, PaginatedResponse, paginate_query, create_pagination_links
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User


@pytest.mark.comprehensive
class TestPaginationComprehensive:
    """Comprehensive pagination tests"""
    
    def test_all_page_sizes(self):
        """Test all valid page sizes"""
        valid_sizes = [1, 10, 20, 50, 100]
        
        for size in valid_sizes:
            params = PaginationParams(page=1, page_size=size)
            assert params.page_size == size
            assert params.limit == size
    
    def test_all_page_numbers(self):
        """Test various page numbers"""
        pages = [1, 2, 10, 100, 1000]
        
        for page in pages:
            params = PaginationParams(page=page, page_size=20)
            assert params.page == page
            assert params.offset == (page - 1) * 20
    
    def test_pagination_links_generation(self):
        """Test pagination links generation"""
        base_url = "https://api.example.com/users"
        links = create_pagination_links(
            base_url=base_url,
            page=2,
            page_size=20,
            total_pages=5,
        )
        
        assert "first" in links
        assert "last" in links
        assert "prev" in links
        assert "next" in links
        assert links["first"].endswith("page=1&page_size=20")
        assert links["last"].endswith("page=5&page_size=20")
    
    def test_pagination_links_first_page(self):
        """Test pagination links on first page"""
        links = create_pagination_links(
            base_url="https://api.example.com/users",
            page=1,
            page_size=20,
            total_pages=5,
        )
        
        assert "prev" not in links
        assert "next" in links
    
    def test_pagination_links_last_page(self):
        """Test pagination links on last page"""
        links = create_pagination_links(
            base_url="https://api.example.com/users",
            page=5,
            page_size=20,
            total_pages=5,
        )
        
        assert "prev" in links
        assert "next" not in links
    
    @pytest.mark.asyncio
    async def test_pagination_with_various_totals(
        self,
        db_session: AsyncSession,
    ):
        """Test pagination with various total counts"""
        import bcrypt
        
        # Create users with different counts
        for count in [0, 1, 10, 25, 50, 100]:
            # Clear existing users
            await db_session.execute(select(User).delete())
            await db_session.commit()
            
            # Create count users
            for i in range(count):
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
            
            # Test pagination
            query = select(User)
            pagination = PaginationParams(page=1, page_size=20)
            result = await paginate_query(db_session, query, pagination)
            
            assert result.total == count
            assert len(result.items) == min(count, 20)

