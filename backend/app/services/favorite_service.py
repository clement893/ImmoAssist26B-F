"""
Favorite Service
Manages favorites/bookmarks
"""

from typing import List, Optional
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.favorite import Favorite
from app.core.logging import logger


class FavoriteService:
    """Service for favorite operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_favorite(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int,
        notes: Optional[str] = None,
        tags: Optional[str] = None
    ) -> Favorite:
        """Add a favorite"""
        # Check if already favorited
        existing = await self.db.execute(
            select(Favorite).where(
                and_(
                    Favorite.user_id == user_id,
                    Favorite.entity_type == entity_type,
                    Favorite.entity_id == entity_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Entity is already favorited")

        favorite = Favorite(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            notes=notes,
            tags=tags
        )
        
        self.db.add(favorite)
        await self.db.commit()
        await self.db.refresh(favorite)
        
        return favorite

    async def remove_favorite(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int
    ) -> bool:
        """Remove a favorite"""
        result = await self.db.execute(
            select(Favorite).where(
                and_(
                    Favorite.user_id == user_id,
                    Favorite.entity_type == entity_type,
                    Favorite.entity_id == entity_id
                )
            )
        )
        favorite = result.scalar_one_or_none()
        
        if favorite:
            await self.db.delete(favorite)
            await self.db.commit()
            return True
        
        return False

    async def get_user_favorites(
        self,
        user_id: int,
        entity_type: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Favorite]:
        """Get all favorites for a user"""
        query = select(Favorite).where(Favorite.user_id == user_id)
        
        if entity_type:
            query = query.where(Favorite.entity_type == entity_type)
        
        query = query.order_by(desc(Favorite.created_at))
        
        if limit:
            query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def is_favorited(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int
    ) -> bool:
        """Check if an entity is favorited by a user"""
        result = await self.db.execute(
            select(Favorite).where(
                and_(
                    Favorite.user_id == user_id,
                    Favorite.entity_type == entity_type,
                    Favorite.entity_id == entity_id
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def update_favorite(
        self,
        favorite_id: int,
        user_id: int,
        notes: Optional[str] = None,
        tags: Optional[str] = None
    ) -> Optional[Favorite]:
        """Update favorite notes or tags"""
        favorite = await self.db.get(Favorite, favorite_id)
        if not favorite or favorite.user_id != user_id:
            return None
        
        if notes is not None:
            favorite.notes = notes
        if tags is not None:
            favorite.tags = tags
        
        await self.db.commit()
        await self.db.refresh(favorite)
        
        return favorite

    async def get_favorites_count(
        self,
        entity_type: str,
        entity_id: int
    ) -> int:
        """Get total number of favorites for an entity"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count(Favorite.id)).where(
                and_(
                    Favorite.entity_type == entity_type,
                    Favorite.entity_id == entity_id
                )
            )
        )
        return result.scalar() or 0




