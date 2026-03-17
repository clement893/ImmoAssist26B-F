"""
Pagination Utilities
Provides pagination support for database queries
"""

from typing import Generic, TypeVar, Optional, List, Annotated
from pydantic import BaseModel, Field
from fastapi import Query, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")
    
    @property
    def offset(self) -> int:
        """Calculate offset from page and page_size"""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get limit (same as page_size)"""
        return self.page_size


def get_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
) -> PaginationParams:
    """
    FastAPI dependency to extract pagination parameters from query string.
    
    Usage:
        @router.get("/items")
        async def list_items(pagination: PaginationParams = Depends(get_pagination_params)):
            ...
    """
    return PaginationParams(page=page, page_size=page_size)


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response model"""
    items: List[T] = Field(description="List of items for current page")
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there is a next page")
    has_previous: bool = Field(description="Whether there is a previous page")
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        """Create paginated response"""
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        )


async def paginate_query(
    session: AsyncSession,
    query: select,
    pagination: PaginationParams,
    count_query: Optional[select] = None,
) -> PaginatedResponse:
    """
    Paginate a SQLAlchemy query
    
    Args:
        session: Database session
        query: SQLAlchemy select query
        pagination: Pagination parameters
        count_query: Optional separate query for counting (for complex queries)
    
    Returns:
        PaginatedResponse with items and metadata
    """
    # Get total count
    if count_query is None:
        # Use a subquery for counting - create a simple count query
        # Remove any eager loading or joins that might cause issues
        from sqlalchemy import func
        # Create a simple count query from the base model
        # Extract the base model from the query
        try:
            # Try to get the entity from the query
            if hasattr(query, 'column_descriptions') and query.column_descriptions:
                entity = query.column_descriptions[0]['entity']
                count_query = select(func.count()).select_from(entity)
            else:
                # Fallback: use subquery
                count_query = select(func.count()).select_from(query.subquery())
        except Exception:
            # Last resort: use subquery
            count_query = select(func.count()).select_from(query.subquery())
    
    try:
        total_result = await session.execute(count_query)
        total = total_result.scalar_one() or 0
    except Exception as e:
        # If count query fails, try a simpler approach
        from app.core.logging import logger
        logger.warning(f"Count query failed, using fallback: {e}")
        # Fallback: execute the main query and count results (less efficient but works)
        all_results = await session.execute(query)
        all_items = all_results.scalars().all()
        total = len(all_items)
    
    # Apply pagination to query
    paginated_query = query.offset(pagination.offset).limit(pagination.limit)
    
    # Execute paginated query
    result = await session.execute(paginated_query)
    items = result.scalars().all()
    
    # Create paginated response
    return PaginatedResponse.create(
        items=list(items),
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


def create_pagination_links(
    base_url: str,
    page: int,
    page_size: int,
    total_pages: int,
    **query_params
) -> dict:
    """Create pagination links for API responses"""
    links = {
        "first": f"{base_url}?page=1&page_size={page_size}",
        "last": f"{base_url}?page={total_pages}&page_size={page_size}",
    }
    
    if page > 1:
        links["prev"] = f"{base_url}?page={page - 1}&page_size={page_size}"
    
    if page < total_pages:
        links["next"] = f"{base_url}?page={page + 1}&page_size={page_size}"
    
    # Add additional query parameters
    if query_params:
        query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
        links = {k: f"{v}&{query_string}" for k, v in links.items()}
    
    return links

