"""
Client Portal - Projects Endpoints
"""

from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permission
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.client import (
    ClientProjectResponse,
    ClientProjectListResponse,
)
from app.services.client_service import ClientService

router = APIRouter(prefix="/client/projects", tags=["Client Portal - Projects"])


@router.get("/", response_model=ClientProjectListResponse)
@require_permission(Permission.CLIENT_VIEW_PROJECTS)
async def get_client_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: Optional[str] = Query(None, description="Filter by status"),
) -> ClientProjectListResponse:
    """
    Get list of projects for the current client
    
    Returns only projects belonging to the authenticated client user.
    """
    service = ClientService(db)
    projects, total = await service.get_client_projects(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
    )
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    page = (skip // limit) + 1 if limit > 0 else 1
    
    return ClientProjectListResponse(
        items=[ClientProjectResponse.model_validate(project) for project in projects],
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/{project_id}", response_model=ClientProjectResponse)
@require_permission(Permission.CLIENT_VIEW_PROJECTS)
async def get_client_project(
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> ClientProjectResponse:
    """
    Get a specific project for the current client
    
    Returns 404 if project doesn't exist or doesn't belong to the client.
    """
    service = ClientService(db)
    project = await service.get_client_project(
        user_id=current_user.id,
        project_id=project_id,
    )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    
    return ClientProjectResponse.model_validate(project)

