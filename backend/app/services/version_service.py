"""
Version Service
Manages version history and revisions
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.models.version import Version
from app.core.logging import logger


class VersionService:
    """Service for version operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_version(
        self,
        entity_type: str,
        entity_id: int,
        content_snapshot: Dict[str, Any],
        user_id: Optional[int] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        change_type: str = 'update'
    ) -> Version:
        """Create a new version"""
        # Get current version number
        current_version = await self.get_current_version(entity_type, entity_id)
        version_number = (current_version.version_number + 1) if current_version else 1
        
        # Get previous version for diff
        previous_version = await self.get_version_by_number(entity_type, entity_id, version_number - 1)
        content_diff = None
        if previous_version and previous_version.content_snapshot:
            content_diff = self._calculate_diff(
                previous_version.content_snapshot,
                content_snapshot
            )
        
        # Mark previous version as not current
        if current_version:
            current_version.is_current = False
            await self.db.flush()
        
        version = Version(
            entity_type=entity_type,
            entity_id=entity_id,
            version_number=version_number,
            title=title,
            description=description,
            content_snapshot=content_snapshot,
            content_diff=content_diff,
            user_id=user_id,
            change_type=change_type,
            is_current=True
        )
        
        self.db.add(version)
        await self.db.commit()
        await self.db.refresh(version)
        
        return version

    async def get_versions(
        self,
        entity_type: str,
        entity_id: int,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Version]:
        """Get all versions for an entity"""
        query = select(Version).where(
            and_(
                Version.entity_type == entity_type,
                Version.entity_id == entity_id
            )
        ).order_by(desc(Version.version_number))
        
        if limit:
            query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_current_version(
        self,
        entity_type: str,
        entity_id: int
    ) -> Optional[Version]:
        """Get the current version of an entity"""
        result = await self.db.execute(
            select(Version).where(
                and_(
                    Version.entity_type == entity_type,
                    Version.entity_id == entity_id,
                    Version.is_current == True
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_version_by_number(
        self,
        entity_type: str,
        entity_id: int,
        version_number: int
    ) -> Optional[Version]:
        """Get a specific version by number"""
        result = await self.db.execute(
            select(Version).where(
                and_(
                    Version.entity_type == entity_type,
                    Version.entity_id == entity_id,
                    Version.version_number == version_number
                )
            )
        )
        return result.scalar_one_or_none()

    async def restore_version(
        self,
        version_id: int,
        user_id: int
    ) -> Version:
        """Restore an entity to a specific version"""
        version = await self.db.get(Version, version_id)
        if not version:
            raise ValueError("Version not found")
        
        # Create a new version from the restored one
        restored_version = await self.create_version(
            entity_type=version.entity_type,
            entity_id=version.entity_id,
            content_snapshot=version.content_snapshot or {},
            user_id=user_id,
            title=f"Restored from version {version.version_number}",
            description=f"Restored from version {version.version_number}",
            change_type='restore'
        )
        
        return restored_version

    def _calculate_diff(
        self,
        old_content: Dict[str, Any],
        new_content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate diff between two content snapshots"""
        diff = {
            'added': {},
            'removed': {},
            'modified': {}
        }
        
        # Find added and modified keys
        for key, new_value in new_content.items():
            if key not in old_content:
                diff['added'][key] = new_value
            elif old_content[key] != new_value:
                diff['modified'][key] = {
                    'old': old_content[key],
                    'new': new_value
                }
        
        # Find removed keys
        for key in old_content:
            if key not in new_content:
                diff['removed'][key] = old_content[key]
        
        return diff

    async def compare_versions(
        self,
        entity_type: str,
        entity_id: int,
        version_number_1: int,
        version_number_2: int
    ) -> Dict[str, Any]:
        """Compare two versions"""
        version1 = await self.get_version_by_number(entity_type, entity_id, version_number_1)
        version2 = await self.get_version_by_number(entity_type, entity_id, version_number_2)
        
        if not version1 or not version2:
            raise ValueError("One or both versions not found")
        
        diff = self._calculate_diff(
            version1.content_snapshot or {},
            version2.content_snapshot or {}
        )
        
        return {
            'version1': {
                'id': version1.id,
                'version_number': version1.version_number,
                'created_at': version1.created_at.isoformat() if version1.created_at else None,
            },
            'version2': {
                'id': version2.id,
                'version_number': version2.version_number,
                'created_at': version2.created_at.isoformat() if version2.created_at else None,
            },
            'diff': diff
        }




