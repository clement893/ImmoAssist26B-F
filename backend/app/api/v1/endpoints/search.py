"""
Search API Endpoints
Advanced search and filtering
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.search_service import SearchService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import AsyncSession, get_db
from app.core.logging import logger

router = APIRouter()


class SearchRequest(BaseModel):
    """Search request model"""
    query: str = Field(..., min_length=1, description="Search query")
    entity_type: str = Field(..., description="Entity type to search: users, projects, etc.")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional filters")
    limit: int = Field(50, ge=1, le=100, description="Maximum number of results")
    offset: int = Field(0, ge=0, description="Offset for pagination")
    order_by: Optional[str] = Field(None, description="Field to order by (e.g., 'created_at desc')")


class SearchResponse(BaseModel):
    """Search response model"""
    results: list
    total: int
    limit: int
    offset: int
    has_more: bool
    query: str


@router.post("/search", response_model=SearchResponse, tags=["search"])
async def search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Perform advanced search across different entity types.
    
    Supports searching users, projects, and other entities with filtering,
    pagination, and custom ordering.
    
    Args:
        request: Search request with query, entity_type, filters, pagination
        current_user: Authenticated user
        db: Database session
        
    Returns:
        SearchResponse: Search results with pagination metadata
        
    Raises:
        HTTPException: 400 if entity_type is unsupported
        HTTPException: 500 if search operation fails
    """
    try:
        service = SearchService(db)
        
        # Route to appropriate search method
        if request.entity_type == 'users':
            result = await service.search_users(
                search_query=request.query,
                filters=request.filters,
                limit=request.limit,
                offset=request.offset
            )
        elif request.entity_type == 'projects':
            result = await service.search_projects(
                search_query=request.query,
                filters=request.filters,
                limit=request.limit,
                offset=request.offset
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported entity type: {request.entity_type}. Supported: users, projects"
            )
        
        return SearchResponse(
            results=result['results'],
            total=result['total'],
            limit=result['limit'],
            offset=result['offset'],
            has_more=result.get('has_more', False),
            query=request.query
        )
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/search/autocomplete", tags=["search"])
async def autocomplete(
    q: str = Query(..., min_length=1, description="Search query"),
    entity_type: str = Query(..., description="Entity type"),
    limit: int = Query(10, ge=1, le=20, description="Maximum suggestions"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get search autocomplete suggestions for quick search.
    
    Returns simplified results optimized for autocomplete UI components.
    
    Args:
        q: Search query (minimum 1 character)
        entity_type: Entity type to search (users, projects, etc.)
        limit: Maximum number of suggestions (default: 10, max: 20)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Suggestions with id, label, and value for each result
        
    Raises:
        HTTPException: 400 if entity_type is unsupported
        HTTPException: 500 if autocomplete operation fails
    """
    try:
        service = SearchService(db)
        
        # Get quick results for autocomplete
        if entity_type == 'users':
            result = await service.search_users(
                search_query=q,
                limit=limit,
                offset=0
            )
        elif entity_type == 'projects':
            result = await service.search_projects(
                search_query=q,
                limit=limit,
                offset=0
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported entity type: {entity_type}"
            )
        
        # Format for autocomplete (simplified results)
        suggestions = []
        for item in result['results']:
            if entity_type == 'users':
                suggestions.append({
                    'id': item.get('id'),
                    'label': item.get('email') or item.get('full_name') or item.get('username'),
                    'value': item.get('id'),
                })
            elif entity_type == 'projects':
                suggestions.append({
                    'id': item.get('id'),
                    'label': item.get('name'),
                    'value': item.get('id'),
                })
        
        return {
            'suggestions': suggestions,
            'query': q
        }
        
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Autocomplete failed: {str(e)}"
        )

