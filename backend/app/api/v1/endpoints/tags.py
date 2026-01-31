"""
Tags and Categories API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.tag_service import TagService, CategoryService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import AsyncSession, get_db
from app.core.logging import logger

router = APIRouter()


# Tag schemas
class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    entity_type: str = Field(..., description="Entity type (e.g., 'project', 'user')")
    entity_id: int = Field(..., description="ID of the entity to tag")
    color: Optional[str] = Field(None, description="Hex color code")
    description: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    color: Optional[str]
    description: Optional[str]
    entity_type: str
    entity_id: int
    usage_count: int
    created_at: str

    class Config:
        from_attributes = True


# Category schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    entity_type: str = Field(..., description="Entity type")
    parent_id: Optional[int] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    parent_id: Optional[int]
    entity_type: str
    sort_order: int
    created_at: str

    class Config:
        from_attributes = True


# Tag endpoints
@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED, tags=["tags"])
async def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new tag"""
    try:
        service = TagService(db)
        tag = await service.create_tag(
            name=tag_data.name,
            entity_type=tag_data.entity_type,
            entity_id=tag_data.entity_id,
            user_id=current_user.id,
            color=tag_data.color,
            description=tag_data.description
        )
        return TagResponse.model_validate(tag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tags/entity/{entity_type}/{entity_id}", response_model=List[TagResponse], tags=["tags"])
async def get_entity_tags(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all tags for an entity"""
    service = TagService(db)
    tags = await service.get_tags_for_entity(entity_type, entity_id)
    return [TagResponse.model_validate(tag) for tag in tags]


@router.post("/tags/{tag_id}/entities/{entity_type}/{entity_id}", tags=["tags"])
async def add_tag_to_entity(
    tag_id: int,
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a tag to an entity"""
    try:
        service = TagService(db)
        entity_tag = await service.add_tag_to_entity(
            tag_id=tag_id,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=current_user.id
        )
        return {"success": True, "message": "Tag added successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/tags/{tag_id}/entities/{entity_type}/{entity_id}", tags=["tags"])
async def remove_tag_from_entity(
    tag_id: int,
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a tag from an entity"""
    service = TagService(db)
    success = await service.remove_tag_from_entity(tag_id, entity_type, entity_id)
    if success:
        return {"success": True, "message": "Tag removed successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Tag not found on entity"
    )


@router.get("/tags/popular", response_model=List[TagResponse], tags=["tags"])
async def get_popular_tags(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get most popular tags"""
    service = TagService(db)
    tags = await service.get_popular_tags(entity_type=entity_type, limit=limit)
    return [TagResponse.model_validate(tag) for tag in tags]


@router.get("/tags", response_model=List[TagResponse], tags=["tags"])
async def list_tags(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of tags to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tags, optionally filtered by entity type"""
    from app.models.tag import Tag
    from sqlalchemy import select
    query = select(Tag)
    
    if entity_type:
        query = query.where(Tag.entity_type == entity_type)
    
    query = query.limit(limit).order_by(Tag.usage_count.desc(), Tag.name)
    result = await db.execute(query)
    tags = result.scalars().all()
    return [TagResponse.model_validate(tag) for tag in tags]


@router.get("/tags/{tag_id}", response_model=TagResponse, tags=["tags"])
async def get_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a tag by ID"""
    from app.models.tag import Tag
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    return TagResponse.model_validate(tag)


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = None
    description: Optional[str] = None


@router.put("/tags/{tag_id}", response_model=TagResponse, tags=["tags"])
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a tag"""
    from app.models.tag import Tag
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Check if user owns the tag or is admin
    from app.dependencies import is_admin_or_superadmin
    is_admin = await is_admin_or_superadmin(current_user, db)
    if tag.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this tag"
        )
    
    # Update tag fields
    updates = tag_data.model_dump(exclude_unset=True)
    if 'name' in updates and updates['name']:
        tag.name = updates['name']
        tag.slug = TagService.slugify(updates['name'])
    if 'color' in updates:
        tag.color = updates['color']
    if 'description' in updates:
        tag.description = updates['description']
    
    await db.commit()
    await db.refresh(tag)
    return TagResponse.model_validate(tag)


@router.delete("/tags/{tag_id}", tags=["tags"])
async def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a tag"""
    from app.models.tag import Tag
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    # Check if user owns the tag or is admin
    from app.dependencies import is_admin_or_superadmin
    is_admin = await is_admin_or_superadmin(current_user, db)
    if tag.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this tag"
        )
    
    service = TagService(db)
    success = await service.delete_tag(tag_id)
    if success:
        return {"success": True, "message": "Tag deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to delete tag"
    )


@router.get("/tags/search", response_model=List[TagResponse], tags=["tags"])
async def search_tags(
    q: str = Query(..., min_length=1, description="Search query"),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search tags"""
    service = TagService(db)
    tags = await service.search_tags(q, entity_type=entity_type, limit=limit)
    return [TagResponse.model_validate(tag) for tag in tags]


# Category endpoints
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, tags=["categories"])
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new category"""
    try:
        service = CategoryService(db)
        category = await service.create_category(
            name=category_data.name,
            entity_type=category_data.entity_type,
            user_id=current_user.id,
            parent_id=category_data.parent_id,
            description=category_data.description,
            icon=category_data.icon,
            color=category_data.color
        )
        return CategoryResponse.model_validate(category)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/categories/tree", response_model=List[CategoryResponse], tags=["categories"])
async def get_category_tree(
    entity_type: Optional[str] = Query(None),
    parent_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get category tree"""
    service = CategoryService(db)
    categories = await service.get_category_tree(entity_type=entity_type, parent_id=parent_id)
    return [CategoryResponse.model_validate(cat) for cat in categories]


@router.get("/categories/{category_id}", response_model=CategoryResponse, tags=["categories"])
async def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get category by ID"""
    from app.models.tag import Category
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return CategoryResponse.model_validate(category)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None


@router.put("/categories/{category_id}", response_model=CategoryResponse, tags=["categories"])
async def update_category(
    category_id: int,
    updates: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a category"""
    service = CategoryService(db)
    updates_dict = updates.model_dump(exclude_unset=True)
    category = await service.update_category(category_id, updates_dict)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return CategoryResponse.model_validate(category)


@router.delete("/categories/{category_id}", tags=["categories"])
async def delete_category(
    category_id: int,
    cascade: bool = Query(False, description="Delete children too"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a category"""
    try:
        service = CategoryService(db)
        success = await service.delete_category(category_id, cascade=cascade)
        if success:
            return {"success": True, "message": "Category deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Category not found"
    )

