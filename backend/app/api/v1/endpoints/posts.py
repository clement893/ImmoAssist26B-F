"""
Posts API Endpoints
Blog posts management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.post import Post
from app.models.user import User
from app.models.tag import Category
from app.dependencies import get_current_user, get_db
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.tenancy_helpers import apply_tenant_scope
from fastapi import Request

router = APIRouter()


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    excerpt: Optional[str] = None
    content: str = Field(..., min_length=1)
    content_html: Optional[str] = None
    status: str = Field(default='draft', pattern='^(draft|published|archived)$')
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200)
    excerpt: Optional[str] = None
    content: Optional[str] = Field(None, min_length=1)
    content_html: Optional[str] = None
    status: Optional[str] = Field(None, pattern='^(draft|published|archived)$')
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


class PostResponse(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    content_html: Optional[str] = None
    status: str
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    published_at: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("/posts", response_model=List[PostResponse], tags=["posts"])
async def list_posts(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Filter by status"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    author_id: Optional[int] = Query(None, description="Filter by author ID"),
    author_slug: Optional[str] = Query(None, description="Filter by author slug/name"),
    year: Optional[int] = Query(None, description="Filter by publication year"),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all posts"""
    query = select(Post)
    
    # Filter by status
    if status:
        query = query.where(Post.status == status)
    else:
        # If not authenticated or not admin, only show published posts
        if not current_user:
            query = query.where(Post.status == 'published')
    
    # Filter by category ID
    if category_id:
        query = query.where(Post.category_id == category_id)
    
    # Filter by category slug
    if category_slug:
        category_query = select(Category).where(Category.slug == category_slug)
        category_result = await db.execute(category_query)
        category = category_result.scalar_one_or_none()
        if category:
            query = query.where(Post.category_id == category.id)
        else:
            # No matching category, return empty result
            query = query.where(Post.id == -1)  # Impossible condition
    
    # Filter by author ID
    if author_id:
        query = query.where(Post.author_id == author_id)
    
    # Filter by author slug/name
    if author_slug:
        # Find user by name or email
        user_query = select(User).where(
            or_(
                User.email.ilike(f"%{author_slug}%"),
                User.first_name.ilike(f"%{author_slug}%"),
                User.last_name.ilike(f"%{author_slug}%")
            )
        )
        user_result = await db.execute(user_query)
        users = user_result.scalars().all()
        if users:
            user_ids = [u.id for u in users]
            query = query.where(Post.author_id.in_(user_ids))
        else:
            # No matching users, return empty result
            query = query.where(Post.id == -1)  # Impossible condition
    
    # Filter by tag (if tags JSON contains the tag)
    if tag:
        # This is a simplified tag filter - in production, you might want a proper tag relationship
        query = query.where(Post.tags.contains([tag]))
    
    # Filter by year
    if year:
        from datetime import datetime
        year_start = datetime(year, 1, 1)
        year_end = datetime(year + 1, 1, 1)
        query = query.where(
            Post.published_at >= year_start,
            Post.published_at < year_end
        )
    
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Post)
    query = query.order_by(Post.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    # Load author and category names
    post_responses = []
    for post in posts:
        author_name = None
        if post.author_id:
            author_result = await db.execute(select(User).where(User.id == post.author_id))
            author = author_result.scalar_one_or_none()
            if author:
                author_name = f"{author.first_name or ''} {author.last_name or ''}".strip() or author.email
        
        category_name = None
        if post.category_id:
            category_result = await db.execute(select(Category).where(Category.id == post.category_id))
            category = category_result.scalar_one_or_none()
            if category:
                category_name = category.name
        
        post_responses.append(PostResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content=post.content,
            content_html=post.content_html,
            status=post.status,
            author_id=post.author_id,
            author_name=author_name,
            category_id=post.category_id,
            category_name=category_name,
            tags=post.tags if isinstance(post.tags, list) else None,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
            meta_keywords=post.meta_keywords,
            published_at=post.published_at.isoformat() if post.published_at else None,
            created_at=post.created_at.isoformat(),
            updated_at=post.updated_at.isoformat(),
        ))
    
    # Log data access
    if current_user:
        try:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.DATA_ACCESSED,
                description=f"Listed {len(posts)} posts",
                user_id=current_user.id,
                ip_address=request.client.host if request.client else None,
            )
        except Exception:
            pass
    
    return post_responses


@router.get("/posts/{slug}", response_model=PostResponse, tags=["posts"])
async def get_post_by_slug(
    slug: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a post by slug"""
    query = select(Post).where(Post.slug == slug)
    
    # If not authenticated or not admin, only show published posts
    if not current_user:
        query = query.where(Post.status == 'published')
    
    query = apply_tenant_scope(query, Post)
    
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Load author and category names
    author_name = None
    if post.author_id:
        author_result = await db.execute(select(User).where(User.id == post.author_id))
        author = author_result.scalar_one_or_none()
        if author:
            author_name = f"{author.first_name or ''} {author.last_name or ''}".strip() or author.email
    
    category_name = None
    if post.category_id:
        category_result = await db.execute(select(Category).where(Category.id == post.category_id))
        category = category_result.scalar_one_or_none()
        if category:
            category_name = category.name
    
    # Log data access
    if current_user:
        try:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.DATA_ACCESSED,
                description=f"Accessed post {slug}",
                user_id=current_user.id,
                ip_address=request.client.host if request.client else None,
            )
        except Exception:
            pass
    
    return PostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        content=post.content,
        content_html=post.content_html,
        status=post.status,
        author_id=post.author_id,
        author_name=author_name,
        category_id=post.category_id,
        category_name=category_name,
        tags=post.tags if isinstance(post.tags, list) else None,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
        meta_keywords=post.meta_keywords,
        published_at=post.published_at.isoformat() if post.published_at else None,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED, tags=["posts"])
async def create_post(
    post_data: PostCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new post"""
    # Check if slug already exists
    existing = await db.execute(select(Post).where(Post.slug == post_data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post with this slug already exists"
        )
    
    # Create post
    post = Post(
        title=post_data.title,
        slug=post_data.slug,
        excerpt=post_data.excerpt,
        content=post_data.content,
        content_html=post_data.content_html,
        status=post_data.status,
        author_id=current_user.id,
        category_id=post_data.category_id,
        tags=post_data.tags,
        meta_title=post_data.meta_title,
        meta_description=post_data.meta_description,
        meta_keywords=post_data.meta_keywords,
    )
    
    # Set published_at if status is published
    if post_data.status == 'published':
        from datetime import datetime
        post.published_at = datetime.utcnow()
    
    db.add(post)
    await db.commit()
    await db.refresh(post)
    
    # Load author and category names
    author_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
    
    category_name = None
    if post.category_id:
        category_result = await db.execute(select(Category).where(Category.id == post.category_id))
        category = category_result.scalar_one_or_none()
        if category:
            category_name = category.name
    
    # Log creation
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_CREATED,
            description=f"Created post: {post.title}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return PostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        content=post.content,
        content_html=post.content_html,
        status=post.status,
        author_id=post.author_id,
        author_name=author_name,
        category_id=post.category_id,
        category_name=category_name,
        tags=post.tags if isinstance(post.tags, list) else None,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
        meta_keywords=post.meta_keywords,
        published_at=post.published_at.isoformat() if post.published_at else None,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.put("/posts/{post_id}", response_model=PostResponse, tags=["posts"])
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a post"""
    query = select(Post).where(Post.id == post_id)
    query = apply_tenant_scope(query, Post)
    
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check ownership (author can edit their own posts, or admin)
    if post.author_id != current_user.id:
        # Check if user is admin (simplified check)
        if not hasattr(current_user, 'is_superadmin') or not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to edit this post"
            )
    
    # Check if slug is being changed and if new slug exists
    if post_data.slug and post_data.slug != post.slug:
        existing = await db.execute(select(Post).where(Post.slug == post_data.slug, Post.id != post_id))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post with this slug already exists"
            )
    
    # Update fields
    if post_data.title is not None:
        post.title = post_data.title
    if post_data.slug is not None:
        post.slug = post_data.slug
    if post_data.excerpt is not None:
        post.excerpt = post_data.excerpt
    if post_data.content is not None:
        post.content = post_data.content
    if post_data.content_html is not None:
        post.content_html = post_data.content_html
    if post_data.status is not None:
        post.status = post_data.status
        # Set published_at if status changed to published
        if post_data.status == 'published' and not post.published_at:
            from datetime import datetime
            post.published_at = datetime.utcnow()
    if post_data.category_id is not None:
        post.category_id = post_data.category_id
    if post_data.tags is not None:
        post.tags = post_data.tags
    if post_data.meta_title is not None:
        post.meta_title = post_data.meta_title
    if post_data.meta_description is not None:
        post.meta_description = post_data.meta_description
    if post_data.meta_keywords is not None:
        post.meta_keywords = post_data.meta_keywords
    
    await db.commit()
    await db.refresh(post)
    
    # Load author and category names
    author_name = None
    if post.author_id:
        author_result = await db.execute(select(User).where(User.id == post.author_id))
        author = author_result.scalar_one_or_none()
        if author:
            author_name = f"{author.first_name or ''} {author.last_name or ''}".strip() or author.email
    
    category_name = None
    if post.category_id:
        category_result = await db.execute(select(Category).where(Category.id == post.category_id))
        category = category_result.scalar_one_or_none()
        if category:
            category_name = category.name
    
    # Log update
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description=f"Updated post {post_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return PostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        content=post.content,
        content_html=post.content_html,
        status=post.status,
        author_id=post.author_id,
        author_name=author_name,
        category_id=post.category_id,
        category_name=category_name,
        tags=post.tags if isinstance(post.tags, list) else None,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
        meta_keywords=post.meta_keywords,
        published_at=post.published_at.isoformat() if post.published_at else None,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["posts"])
async def delete_post(
    post_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a post"""
    query = select(Post).where(Post.id == post_id)
    query = apply_tenant_scope(query, Post)
    
    result = await db.execute(query)
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check ownership
    if post.author_id != current_user.id:
        # Check if user is admin
        if not hasattr(current_user, 'is_superadmin') or not current_user.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this post"
            )
    
    await db.delete(post)
    await db.commit()
    
    # Log deletion
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description=f"Deleted post {post_id}",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )
    except Exception:
        pass
    
    return None
