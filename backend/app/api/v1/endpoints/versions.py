"""
Version History API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.version_service import VersionService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


class VersionCreate(BaseModel):
    entity_type: str = Field(..., description="Entity type (e.g., 'project', 'document')")
    entity_id: int = Field(..., description="ID of the entity")
    content_snapshot: dict = Field(..., description="Full snapshot of entity data")
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    change_type: str = Field('update', description="Type of change: create, update, delete, restore")


class VersionResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    version_number: int
    title: Optional[str]
    description: Optional[str]
    content_snapshot: Optional[dict]
    content_diff: Optional[dict]
    user_id: Optional[int]
    change_type: Optional[str]
    is_current: bool
    created_at: str

    class Config:
        from_attributes = True


@router.post("/versions", response_model=VersionResponse, status_code=status.HTTP_201_CREATED, tags=["versions"])
async def create_version(
    version_data: VersionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new version"""
    try:
        service = VersionService(db)
        version = await service.create_version(
            entity_type=version_data.entity_type,
            entity_id=version_data.entity_id,
            content_snapshot=version_data.content_snapshot,
            user_id=current_user.id,
            title=version_data.title,
            description=version_data.description,
            change_type=version_data.change_type
        )
        return VersionResponse.model_validate(version)
    except Exception as e:
        logger.error(f"Failed to create version: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create version: {str(e)}"
        )


@router.get("/versions/{entity_type}/{entity_id}", response_model=List[VersionResponse], tags=["versions"])
async def get_versions(
    entity_type: str,
    entity_id: int,
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all versions for an entity"""
    service = VersionService(db)
    versions = await service.get_versions(
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset
    )
    return [VersionResponse.model_validate(v) for v in versions]


@router.get("/versions/{entity_type}/{entity_id}/current", response_model=VersionResponse, tags=["versions"])
async def get_current_version(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current version of an entity"""
    service = VersionService(db)
    version = await service.get_current_version(entity_type, entity_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No version found for this entity"
        )
    return VersionResponse.model_validate(version)


@router.get("/versions/{entity_type}/{entity_id}/{version_number}", response_model=VersionResponse, tags=["versions"])
async def get_version_by_number(
    entity_type: str,
    entity_id: int,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific version by number"""
    service = VersionService(db)
    version = await service.get_version_by_number(entity_type, entity_id, version_number)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    return VersionResponse.model_validate(version)


@router.post("/versions/{version_id}/restore", response_model=VersionResponse, tags=["versions"])
async def restore_version(
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Restore an entity to a specific version"""
    try:
        service = VersionService(db)
        restored_version = await service.restore_version(version_id, current_user.id)
        return VersionResponse.model_validate(restored_version)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/versions/{entity_type}/{entity_id}/compare", tags=["versions"])
async def compare_versions(
    entity_type: str,
    entity_id: int,
    version1: int = Query(..., description="First version number"),
    version2: int = Query(..., description="Second version number"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compare two versions"""
    try:
        service = VersionService(db)
        comparison = await service.compare_versions(
            entity_type=entity_type,
            entity_id=entity_id,
            version_number_1=version1,
            version_number_2=version2
        )
        return comparison
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )




