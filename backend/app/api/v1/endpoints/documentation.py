"""
Documentation API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from pydantic import BaseModel, Field

from app.services.documentation_service import DocumentationService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from app.core.logging import logger
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class ArticleCreate(BaseModel):
    slug: str = Field(..., min_length=1, max_length=200)
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    excerpt: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_published: bool = False
    is_featured: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    excerpt: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class ArticleResponse(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    excerpt: Optional[str]
    category_id: Optional[int]
    tags: Optional[List[str]]
    is_published: bool
    is_featured: bool
    view_count: int
    helpful_count: int
    not_helpful_count: int
    created_at: str
    updated_at: str
    published_at: Optional[str]

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    order: int
    icon: Optional[str]

    class Config:
        from_attributes = True


class FeedbackSubmit(BaseModel):
    is_helpful: bool
    comment: Optional[str] = None


@router.post("/documentation/articles", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED, tags=["documentation"])
async def create_article(
    article_data: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new documentation article.
    
    Args:
        article_data: Article creation data including slug, title, content, etc.
        current_user: Authenticated user (will be set as author)
        db: Database session
        
    Returns:
        ArticleResponse: Created article with all fields
        
    Raises:
        HTTPException: 400 if slug already exists or validation fails
        HTTPException: 401 if user is not authenticated
    """
    service = DocumentationService(db)
    try:
        article = await service.create_article(
            slug=article_data.slug,
            title=article_data.title,
            content=article_data.content,
            excerpt=article_data.excerpt,
            category_id=article_data.category_id,
            tags=article_data.tags,
            is_published=article_data.is_published,
            is_featured=article_data.is_featured,
            meta_title=article_data.meta_title,
            meta_description=article_data.meta_description,
            author_id=current_user.id
        )
        logger.info(
            f"Documentation article created: {article.slug} by user {current_user.id}",
            context={"article_id": article.id, "user_id": current_user.id, "is_published": article.is_published}
        )
        return ArticleResponse.model_validate(article)
    except Exception as e:
        logger.error(
            f"Failed to create documentation article: {e}",
            context={"slug": article_data.slug, "user_id": current_user.id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create article"
        )


@router.get("/documentation/articles", response_model=List[ArticleResponse], tags=["documentation"])
async def get_articles(
    category_id: Optional[int] = Query(None),
    featured_only: bool = Query(False),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get published documentation articles with optional filtering.
    
    Args:
        category_id: Filter by category ID (optional)
        featured_only: Return only featured articles (default: False)
        search: Search query to filter articles (optional)
        limit: Maximum number of results (default: 50, max: 100)
        offset: Pagination offset (default: 0)
        db: Database session
        
    Returns:
        List[ArticleResponse]: List of published articles matching criteria
    """
    service = DocumentationService(db)
    articles = await service.get_published_articles(
        category_id=category_id,
        featured_only=featured_only,
        search_query=search,
        limit=limit,
        offset=offset
    )
    return [ArticleResponse.model_validate(a) for a in articles]


@router.get("/documentation/articles/{slug}", response_model=ArticleResponse, tags=["documentation"])
async def get_article(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a published documentation article by slug.
    
    Args:
        slug: Article slug (URL-friendly identifier)
        db: Database session
        
    Returns:
        ArticleResponse: Article data with incremented view count
        
    Raises:
        HTTPException: 404 if article not found or not published
    """
    service = DocumentationService(db)
    article = await service.get_article(slug)
    if not article or not article.is_published:
        logger.debug(f"Article not found or not published: {slug}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    
    # Increment view count
    await service.increment_view_count(article.id)
    logger.debug(f"Article viewed: {slug} (view count: {article.view_count + 1})")
    
    return ArticleResponse.model_validate(article)


@router.post("/documentation/articles/{article_id}/feedback", tags=["documentation"])
async def submit_feedback(
    article_id: int,
    feedback_data: FeedbackSubmit = Body(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit feedback on a documentation article.
    
    Args:
        article_id: ID of the article to provide feedback on
        feedback_data: Feedback data (helpful/not helpful, optional comment)
        current_user: Authenticated user (optional, feedback can be anonymous)
        db: Database session
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if article not found
    """
    service = DocumentationService(db)
    try:
        feedback = await service.submit_feedback(
            article_id=article_id,
            is_helpful=feedback_data.is_helpful,
            comment=feedback_data.comment,
            user_id=current_user.id if current_user else None
        )
        logger.info(
            f"Documentation feedback submitted for article {article_id}",
            context={
                "article_id": article_id,
                "user_id": current_user.id if current_user else None,
                "is_helpful": feedback_data.is_helpful
            }
        )
        return {"success": True, "message": "Feedback submitted"}
    except Exception as e:
        logger.error(
            f"Failed to submit documentation feedback: {e}",
            context={"article_id": article_id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback"
        )


@router.get("/documentation/categories", response_model=List[CategoryResponse], tags=["documentation"])
async def get_categories(
    parent_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Get documentation categories, optionally filtered by parent.
    
    Args:
        parent_id: Filter categories by parent ID (None returns root categories)
        db: Database session
        
    Returns:
        List[CategoryResponse]: List of categories matching criteria
    """
    service = DocumentationService(db)
    categories = await service.get_categories(parent_id=parent_id)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.put("/documentation/articles/{article_id}", response_model=ArticleResponse, tags=["documentation"])
async def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing documentation article.
    
    Args:
        article_id: ID of the article to update
        article_data: Article update data (only provided fields will be updated)
        current_user: Authenticated user (must be author or admin)
        db: Database session
        
    Returns:
        ArticleResponse: Updated article
        
    Raises:
        HTTPException: 404 if article not found
        HTTPException: 403 if user is not authorized to update
    """
    service = DocumentationService(db)
    updates = article_data.model_dump(exclude_unset=True)
    try:
        article = await service.update_article(article_id, updates)
        if not article:
            logger.warning(f"Attempted to update non-existent article: {article_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Article not found"
            )
        logger.info(
            f"Documentation article updated: {article.slug} by user {current_user.id}",
            context={"article_id": article_id, "user_id": current_user.id, "updated_fields": list(updates.keys())}
        )
        return ArticleResponse.model_validate(article)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to update documentation article: {e}",
            context={"article_id": article_id, "user_id": current_user.id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update article"
        )


@router.delete("/documentation/articles/{article_id}", tags=["documentation"])
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a documentation article.
    
    Args:
        article_id: ID of the article to delete
        current_user: Authenticated user (must be author or admin)
        db: Database session
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if article not found
        HTTPException: 403 if user is not authorized to delete
    """
    service = DocumentationService(db)
    try:
        success = await service.delete_article(article_id)
        if success:
            logger.info(
                f"Documentation article deleted: {article_id} by user {current_user.id}",
                context={"article_id": article_id, "user_id": current_user.id}
            )
            return {"success": True, "message": "Article deleted successfully"}
        logger.warning(f"Attempted to delete non-existent article: {article_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Failed to delete documentation article: {e}",
            context={"article_id": article_id, "user_id": current_user.id},
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete article"
        )

