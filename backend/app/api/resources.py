"""Resource endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.core.cache import cached

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("")
@cached(expire=300, key_prefix="resources")
async def list_resources(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List resources."""
    return {
        "items": [],
        "total": 0,
        "skip": skip,
        "limit": limit,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_resource(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new resource."""
    return {"id": "resource-1", "created_by": str(current_user.id)}


@router.get("/{resource_id}")
@cached(expire=300, key_prefix="resource")
async def get_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get resource by ID."""
    return {"id": resource_id, "owner": str(current_user.id)}


@router.put("/{resource_id}")
async def update_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update resource."""
    return {"id": resource_id, "updated_by": str(current_user.id)}


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete resource."""
    pass
