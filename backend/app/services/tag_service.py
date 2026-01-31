"""
Tag Service
Manages tags and tagging operations
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.tag import Tag, Category, EntityTag
from app.core.logging import logger
import re


class TagService:
    """Service for tag operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text

    async def create_tag(
        self,
        name: str,
        entity_type: str,
        entity_id: int,
        user_id: int,
        color: Optional[str] = None,
        description: Optional[str] = None
    ) -> Tag:
        """Create a new tag"""
        slug = self.slugify(name)
        
        # Check if tag already exists for this entity
        existing = await self.db.execute(
            select(Tag).where(
                and_(
                    Tag.slug == slug,
                    Tag.entity_type == entity_type,
                    Tag.entity_id == entity_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Tag '{name}' already exists for this entity")

        tag = Tag(
            name=name,
            slug=slug,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            color=color,
            description=description,
            usage_count=1
        )
        
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)
        
        return tag

    async def get_tags_for_entity(
        self,
        entity_type: str,
        entity_id: int
    ) -> List[Tag]:
        """Get all tags for an entity"""
        result = await self.db.execute(
            select(Tag).where(
                and_(
                    Tag.entity_type == entity_type,
                    Tag.entity_id == entity_id
                )
            ).order_by(Tag.name)
        )
        return list(result.scalars().all())

    async def add_tag_to_entity(
        self,
        tag_id: int,
        entity_type: str,
        entity_id: int,
        user_id: int
    ) -> EntityTag:
        """Add an existing tag to an entity"""
        # Check if already tagged
        existing = await self.db.execute(
            select(EntityTag).where(
                and_(
                    EntityTag.entity_type == entity_type,
                    EntityTag.entity_id == entity_id,
                    EntityTag.tag_id == tag_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Entity already has this tag")

        entity_tag = EntityTag(
            entity_type=entity_type,
            entity_id=entity_id,
            tag_id=tag_id,
            user_id=user_id
        )
        
        # Increment tag usage count
        tag = await self.db.get(Tag, tag_id)
        if tag:
            tag.usage_count += 1
        
        self.db.add(entity_tag)
        await self.db.commit()
        await self.db.refresh(entity_tag)
        
        return entity_tag

    async def remove_tag_from_entity(
        self,
        tag_id: int,
        entity_type: str,
        entity_id: int
    ) -> bool:
        """Remove a tag from an entity"""
        result = await self.db.execute(
            select(EntityTag).where(
                and_(
                    EntityTag.entity_type == entity_type,
                    EntityTag.entity_id == entity_id,
                    EntityTag.tag_id == tag_id
                )
            )
        )
        entity_tag = result.scalar_one_or_none()
        
        if entity_tag:
            # Decrement tag usage count
            tag = await self.db.get(Tag, tag_id)
            if tag and tag.usage_count > 0:
                tag.usage_count -= 1
            
            await self.db.delete(entity_tag)
            await self.db.commit()
            return True
        
        return False

    async def get_popular_tags(
        self,
        entity_type: Optional[str] = None,
        limit: int = 20
    ) -> List[Tag]:
        """Get most popular tags"""
        query = select(Tag).order_by(Tag.usage_count.desc(), Tag.name)
        
        if entity_type:
            query = query.where(Tag.entity_type == entity_type)
        
        query = query.limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def search_tags(
        self,
        query: str,
        entity_type: Optional[str] = None,
        limit: int = 20
    ) -> List[Tag]:
        """Search tags by name"""
        search_query = select(Tag).where(
            Tag.name.ilike(f'%{query}%')
        ).order_by(Tag.usage_count.desc(), Tag.name)
        
        if entity_type:
            search_query = search_query.where(Tag.entity_type == entity_type)
        
        search_query = search_query.limit(limit)
        
        result = await self.db.execute(search_query)
        return list(result.scalars().all())

    async def delete_tag(self, tag_id: int) -> bool:
        """Delete a tag"""
        tag = await self.db.get(Tag, tag_id)
        if tag:
            await self.db.delete(tag)
            await self.db.commit()
            return True
        return False


class CategoryService:
    """Service for category operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text

    async def create_category(
        self,
        name: str,
        entity_type: str,
        user_id: int,
        parent_id: Optional[int] = None,
        description: Optional[str] = None,
        icon: Optional[str] = None,
        color: Optional[str] = None
    ) -> Category:
        """Create a new category"""
        slug = self.slugify(name)
        
        # Check if category with same slug exists
        existing = await self.db.execute(
            select(Category).where(Category.slug == slug)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Category with slug '{slug}' already exists")

        category = Category(
            name=name,
            slug=slug,
            entity_type=entity_type,
            user_id=user_id,
            parent_id=parent_id,
            description=description,
            icon=icon,
            color=color
        )
        
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        
        return category

    async def get_category_tree(
        self,
        entity_type: Optional[str] = None,
        parent_id: Optional[int] = None
    ) -> List[Category]:
        """Get category tree (hierarchical)"""
        query = select(Category)
        
        if entity_type:
            query = query.where(Category.entity_type == entity_type)
        
        if parent_id is None:
            query = query.where(Category.parent_id.is_(None))
        else:
            query = query.where(Category.parent_id == parent_id)
        
        query = query.order_by(Category.sort_order, Category.name)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_category_by_slug(self, slug: str) -> Optional[Category]:
        """Get category by slug"""
        result = await self.db.execute(
            select(Category).where(Category.slug == slug)
        )
        return result.scalar_one_or_none()

    async def update_category(
        self,
        category_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Category]:
        """Update a category"""
        category = await self.db.get(Category, category_id)
        if not category:
            return None
        
        for key, value in updates.items():
            if hasattr(category, key) and value is not None:
                setattr(category, key, value)
        
        if 'name' in updates:
            category.slug = self.slugify(updates['name'])
        
        await self.db.commit()
        await self.db.refresh(category)
        
        return category

    async def delete_category(self, category_id: int, cascade: bool = False) -> bool:
        """Delete a category"""
        category = await self.db.get(Category, category_id)
        if not category:
            return False
        
        # Check for children
        children = await self.get_category_tree(parent_id=category_id)
        if children and not cascade:
            raise ValueError("Cannot delete category with children. Set cascade=True to delete children too.")
        
        # Delete children if cascade
        if cascade:
            for child in children:
                await self.delete_category(child.id, cascade=True)
        
        await self.db.delete(category)
        await self.db.commit()
        
        return True




