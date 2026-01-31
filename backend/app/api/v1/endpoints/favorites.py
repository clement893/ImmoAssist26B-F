"""
Favorites API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.favorite_service import FavoriteService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


class FavoriteCreate(BaseModel):
    entity_type: str = Field(..., description="Entity type (e.g., 'project', 'file')")
    entity_id: int = Field(..., description="ID of the entity to favorite")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")
    tags: Optional[str] = Field(None, max_length=200, description="Optional tags (comma-separated)")


class FavoriteUpdate(BaseModel):
    notes: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = Field(None, max_length=200)


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    entity_type: str
    entity_id: int
    notes: Optional[str]
    tags: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("/favorites", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED, tags=["favorites"])
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a favorite/bookmark"""
    try:
        service = FavoriteService(db)
        favorite = await service.add_favorite(
            user_id=current_user.id,
            entity_type=favorite_data.entity_type,
            entity_id=favorite_data.entity_id,
            notes=favorite_data.notes,
            tags=favorite_data.tags
        )
        return FavoriteResponse.model_validate(favorite)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/favorites/{entity_type}/{entity_id}", tags=["favorites"])
async def remove_favorite(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a favorite/bookmark"""
    service = FavoriteService(db)
    success = await service.remove_favorite(
        user_id=current_user.id,
        entity_type=entity_type,
        entity_id=entity_id
    )
    if success:
        return {"success": True, "message": "Favorite removed successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Favorite not found"
    )


@router.get("/favorites", response_model=List[FavoriteResponse], tags=["favorites"])
async def get_favorites(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all favorites for the current user"""
    service = FavoriteService(db)
    favorites = await service.get_user_favorites(
        user_id=current_user.id,
        entity_type=entity_type,
        limit=limit,
        offset=offset
    )
    return [FavoriteResponse.model_validate(fav) for fav in favorites]


@router.get("/favorites/check/{entity_type}/{entity_id}", tags=["favorites"])
async def check_favorite(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if an entity is favorited"""
    service = FavoriteService(db)
    is_favorited = await service.is_favorited(
        user_id=current_user.id,
        entity_type=entity_type,
        entity_id=entity_id
    )
    return {"is_favorited": is_favorited}


@router.put("/favorites/{favorite_id}", response_model=FavoriteResponse, tags=["favorites"])
async def update_favorite(
    favorite_id: int,
    favorite_data: FavoriteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update favorite notes or tags"""
    service = FavoriteService(db)
    favorite = await service.update_favorite(
        favorite_id=favorite_id,
        user_id=current_user.id,
        notes=favorite_data.notes,
        tags=favorite_data.tags
    )
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    return FavoriteResponse.model_validate(favorite)


@router.get("/favorites/count/{entity_type}/{entity_id}", tags=["favorites"])
async def get_favorites_count(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get total number of favorites for an entity"""
    service = FavoriteService(db)
    count = await service.get_favorites_count(entity_type, entity_id)
    return {"count": count}




