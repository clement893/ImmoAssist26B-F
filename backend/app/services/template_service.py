"""
Template Service
Manages templates and template rendering
"""

from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import re

from app.models.template import Template, TemplateVariable
from app.core.logging import logger


class TemplateService:
    """Service for template operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text

    async def create_template(
        self,
        name: str,
        content: str,
        entity_type: str,
        user_id: int,
        category: Optional[str] = None,
        description: Optional[str] = None,
        content_html: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None,
        is_public: bool = False
    ) -> Template:
        """Create a new template"""
        slug = self.slugify(name)
        
        # Check if template with same slug exists
        existing = await self.db.execute(
            select(Template).where(Template.slug == slug)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Template with slug '{slug}' already exists")

        template = Template(
            name=name,
            slug=slug,
            content=content,
            content_html=content_html,
            entity_type=entity_type,
            user_id=user_id,
            category=category,
            description=description,
            variables=variables,
            is_public=is_public
        )
        
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        
        return template

    async def get_template(
        self,
        template_id: int,
        user_id: Optional[int] = None
    ) -> Optional[Template]:
        """Get a template by ID"""
        template = await self.db.get(Template, template_id)
        if not template:
            return None
        
        # Check access (public or owner)
        if not template.is_public and user_id and template.user_id != user_id:
            return None
        
        return template

    async def get_templates(
        self,
        entity_type: Optional[str] = None,
        category: Optional[str] = None,
        user_id: Optional[int] = None,
        include_public: bool = True,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Template]:
        """Get templates with filters"""
        query = select(Template)
        
        filters = []
        
        if entity_type:
            filters.append(Template.entity_type == entity_type)
        
        if category:
            filters.append(Template.category == category)
        
        # Access control: user's templates or public templates
        if user_id:
            if include_public:
                filters.append(
                    or_(
                        Template.user_id == user_id,
                        Template.is_public == True
                    )
                )
            else:
                filters.append(Template.user_id == user_id)
        elif not include_public:
            # If no user_id and include_public is False, return empty
            return []
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(desc(Template.usage_count), desc(Template.created_at))
        
        if limit:
            query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def render_template(
        self,
        template_id: int,
        variables: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> str:
        """Render a template with provided variables"""
        template = await self.get_template(template_id, user_id)
        if not template:
            raise ValueError("Template not found or access denied")
        
        # Increment usage count
        template.usage_count += 1
        await self.db.commit()
        
        # Simple variable substitution
        rendered = template.content
        for key, value in variables.items():
            # Replace {{variable}} or {variable} patterns
            rendered = re.sub(r'\{\{' + re.escape(key) + r'\}\}', str(value), rendered)
            rendered = re.sub(r'\{' + re.escape(key) + r'\}', str(value), rendered)
        
        return rendered

    async def update_template(
        self,
        template_id: int,
        user_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Template]:
        """Update a template"""
        template = await self.db.get(Template, template_id)
        if not template:
            return None
        
        # Check ownership
        if template.user_id != user_id and not template.is_system:
            raise ValueError("User does not have permission to edit this template")
        
        for key, value in updates.items():
            if hasattr(template, key) and value is not None:
                if key == 'name' and value != template.name:
                    # Update slug if name changes
                    template.slug = self.slugify(value)
                setattr(template, key, value)
        
        await self.db.commit()
        await self.db.refresh(template)
        
        return template

    async def delete_template(
        self,
        template_id: int,
        user_id: int
    ) -> bool:
        """Delete a template"""
        template = await self.db.get(Template, template_id)
        if not template:
            return False
        
        # Check ownership and system template
        if template.user_id != user_id:
            raise ValueError("User does not have permission to delete this template")
        
        if template.is_system:
            raise ValueError("Cannot delete system template")
        
        await self.db.delete(template)
        await self.db.commit()
        
        return True

    async def duplicate_template(
        self,
        template_id: int,
        user_id: int,
        new_name: Optional[str] = None
    ) -> Optional[Template]:
        """Duplicate a template"""
        template = await self.get_template(template_id, user_id)
        if not template:
            return None
        
        new_template = Template(
            name=new_name or f"{template.name} (Copy)",
            slug=self.slugify(new_name or f"{template.name}-copy"),
            content=template.content,
            content_html=template.content_html,
            entity_type=template.entity_type,
            user_id=user_id,
            category=template.category,
            description=template.description,
            variables=template.variables,
            is_public=False  # Duplicates are private by default
        )
        
        self.db.add(new_template)
        await self.db.commit()
        await self.db.refresh(new_template)
        
        return new_template




