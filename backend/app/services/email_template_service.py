"""
Email Template Service
Manages email templates
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.models.email_template import EmailTemplate, EmailTemplateVersion
from app.core.logging import logger


class EmailTemplateService:
    """Service for email template operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_template(
        self,
        key: str,
        name: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        category: Optional[str] = None,
        variables: Optional[List[str]] = None,
        language: str = 'en',
        description: Optional[str] = None,
        is_active: bool = True,
        is_system: bool = False,
        created_by_id: Optional[int] = None
    ) -> EmailTemplate:
        """Create a new email template"""
        # Check if template with same key exists
        existing = await self.db.execute(
            select(EmailTemplate).where(EmailTemplate.key == key)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Email template with key '{key}' already exists")
        
        template = EmailTemplate(
            key=key,
            name=name,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            category=category,
            variables=json.dumps(variables) if variables else None,
            language=language,
            description=description,
            is_active=is_active,
            is_system=is_system,
            created_by_id=created_by_id
        )
        
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        
        # Create initial version
        await self._create_version(template, created_by_id)
        
        return template

    async def get_template(self, key: str, language: str = 'en') -> Optional[EmailTemplate]:
        """Get a template by key"""
        result = await self.db.execute(
            select(EmailTemplate).where(
                and_(
                    EmailTemplate.key == key,
                    EmailTemplate.language == language
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_template_by_id(self, template_id: int) -> Optional[EmailTemplate]:
        """Get a template by ID"""
        return await self.db.get(EmailTemplate, template_id)

    async def get_all_templates(
        self,
        category: Optional[str] = None,
        language: Optional[str] = None,
        active_only: bool = False
    ) -> List[EmailTemplate]:
        """Get all templates"""
        query = select(EmailTemplate)
        
        if category:
            query = query.where(EmailTemplate.category == category)
        
        if language:
            query = query.where(EmailTemplate.language == language)
        
        if active_only:
            query = query.where(EmailTemplate.is_active == True)
        
        result = await self.db.execute(query.order_by(EmailTemplate.category, EmailTemplate.name))
        return list(result.scalars().all())

    async def update_template(
        self,
        template_id: int,
        updates: Dict[str, Any],
        created_by_id: Optional[int] = None
    ) -> Optional[EmailTemplate]:
        """Update a template"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return None
        
        # Store current version before updating
        current_subject = template.subject
        current_html_body = template.html_body
        current_text_body = template.text_body
        
        for key, value in updates.items():
            if hasattr(template, key) and value is not None:
                if key == 'variables' and isinstance(value, list):
                    setattr(template, key, json.dumps(value))
                else:
                    setattr(template, key, value)
        
        await self.db.commit()
        await self.db.refresh(template)
        
        # Create version if content changed
        if (current_subject != template.subject or 
            current_html_body != template.html_body or 
            current_text_body != template.text_body):
            await self._create_version(template, created_by_id)
        
        return template

    async def _create_version(
        self,
        template: EmailTemplate,
        created_by_id: Optional[int] = None
    ) -> EmailTemplateVersion:
        """Create a version snapshot"""
        # Get latest version number
        result = await self.db.execute(
            select(EmailTemplateVersion).where(
                EmailTemplateVersion.template_id == template.id
            ).order_by(desc(EmailTemplateVersion.version_number))
        )
        latest_version = result.scalar_one_or_none()
        next_version = (latest_version.version_number + 1) if latest_version else 1
        
        version = EmailTemplateVersion(
            template_id=template.id,
            subject=template.subject,
            html_body=template.html_body,
            text_body=template.text_body,
            version_number=next_version,
            created_by_id=created_by_id
        )
        
        self.db.add(version)
        await self.db.commit()
        await self.db.refresh(version)
        
        return version

    async def render_template(
        self,
        key: str,
        variables: Dict[str, Any],
        language: str = 'en'
    ) -> Optional[Dict[str, str]]:
        """Render a template with variables"""
        template = await self.get_template(key, language)
        if not template or not template.is_active:
            return None
        
        subject = template.subject
        html_body = template.html_body
        text_body = template.text_body or ''
        
        # Replace variables
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            subject = subject.replace(placeholder, str(var_value))
            html_body = html_body.replace(placeholder, str(var_value))
            text_body = text_body.replace(placeholder, str(var_value))
        
        return {
            'subject': subject,
            'html_body': html_body,
            'text_body': text_body
        }

    async def delete_template(self, template_id: int) -> bool:
        """Delete a template"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return False
        
        if template.is_system:
            raise ValueError("Cannot delete system templates")
        
        await self.db.delete(template)
        await self.db.commit()
        
        return True

    async def get_template_versions(
        self,
        template_id: int
    ) -> List[EmailTemplateVersion]:
        """Get version history for a template"""
        result = await self.db.execute(
            select(EmailTemplateVersion).where(
                EmailTemplateVersion.template_id == template_id
            ).order_by(desc(EmailTemplateVersion.version_number))
        )
        return list(result.scalars().all())




