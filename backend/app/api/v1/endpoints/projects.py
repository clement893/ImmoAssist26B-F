"""
Project Management Endpoints
"""

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.core.cache import cached, invalidate_cache_pattern
from app.core.rate_limit import rate_limit_decorator
from app.core.tenancy_helpers import apply_tenant_scope
from app.dependencies import get_current_user
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.schemas.project import Project as ProjectSchema, ProjectCreate, ProjectUpdate

router = APIRouter()


@router.get("/", response_model=List[ProjectSchema])
@rate_limit_decorator("200/hour")
@cached(expire=300, key_prefix="projects")
async def get_projects(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records"),
    status: ProjectStatus | None = Query(None, description="Filter by status"),
) -> List[Project]:
    """
    Get list of projects for the current user
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Optional status filter
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        List of projects
    """
    query = select(Project).where(Project.user_id == current_user.id)
    
    if status:
        query = query.where(Project.status == status)
    
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Project)
    
    query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    # Convert to JSONResponse for slowapi compatibility
    project_schemas = [ProjectSchema.model_validate(project) for project in projects]
    return JSONResponse(
        content=[project.model_dump(mode='json') for project in project_schemas],
        status_code=200
    )


@router.get("/{project_id}", response_model=ProjectSchema)
@cached(expire=300, key_prefix="project")
async def get_project(
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> Project:
    """
    Get a specific project by ID
    
    Args:
        project_id: Project ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Project details
        
    Raises:
        HTTPException: If project not found or user doesn't have access
    """
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return project


@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
@rate_limit_decorator("30/hour")
@invalidate_cache_pattern("projects:*")
async def create_project(
    request: Request,
    project_data: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> Project:
    """
    Create a new project
    
    Args:
        project_data: Project creation data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Created project
    """
    project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status,
        user_id=current_user.id,
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return project


@router.put("/{project_id}", response_model=ProjectSchema)
@rate_limit_decorator("100/hour")
@invalidate_cache_pattern("projects:*")
@invalidate_cache_pattern("project:*")
async def update_project(
    request: Request,
    project_id: int,
    project_data: ProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> Project:
    """
    Update a project
    
    Args:
        project_id: Project ID
        project_data: Project update data
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated project
        
    Raises:
        HTTPException: If project not found or user doesn't have access
    """
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit_decorator("50/hour")
@invalidate_cache_pattern("projects:*")
@invalidate_cache_pattern("project:*")
async def delete_project(
    request: Request,
    project_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a project
    
    Args:
        project_id: Project ID
        current_user: Current authenticated user
        db: Database session
        
    Raises:
        HTTPException: If project not found or user doesn't have access
    """
    result = await db.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.user_id == current_user.id)
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    await db.delete(project)
    await db.commit()

