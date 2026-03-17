"""
Templates API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.template_service import TemplateService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger

router = APIRouter()


class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    entity_type: str = Field(..., description="Entity type (e.g., 'email', 'project', 'document')")
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    content_html: Optional[str] = None
    variables: Optional[dict] = None
    is_public: bool = Field(False, description="Make template publicly available")


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    content_html: Optional[str] = None
    variables: Optional[dict] = None
    is_public: Optional[bool] = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    category: Optional[str]
    content: str
    content_html: Optional[str]
    variables: Optional[dict]
    entity_type: str
    user_id: int
    is_public: bool
    usage_count: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class TemplateRenderRequest(BaseModel):
    variables: dict = Field(..., description="Variables to substitute in template")


@router.post("/templates", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED, tags=["templates"])
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new template"""
    try:
        service = TemplateService(db)
        template = await service.create_template(
            name=template_data.name,
            content=template_data.content,
            entity_type=template_data.entity_type,
            user_id=current_user.id,
            category=template_data.category,
            description=template_data.description,
            content_html=template_data.content_html,
            variables=template_data.variables,
            is_public=template_data.is_public
        )
        return TemplateResponse.model_validate(template)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/templates", response_model=List[TemplateResponse], tags=["templates"])
async def get_templates(
    entity_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    include_public: bool = Query(True),
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get templates"""
    service = TemplateService(db)
    templates = await service.get_templates(
        entity_type=entity_type,
        category=category,
        user_id=current_user.id,
        include_public=include_public,
        limit=limit,
        offset=offset
    )
    return [TemplateResponse.model_validate(t) for t in templates]


@router.get("/templates/{template_id}", response_model=TemplateResponse, tags=["templates"])
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a template by ID"""
    service = TemplateService(db)
    template = await service.get_template(template_id, current_user.id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return TemplateResponse.model_validate(template)


@router.post("/templates/{template_id}/render", tags=["templates"])
async def render_template(
    template_id: int,
    render_data: TemplateRenderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Render a template with variables"""
    try:
        service = TemplateService(db)
        rendered = await service.render_template(
            template_id=template_id,
            variables=render_data.variables,
            user_id=current_user.id
        )
        return {"rendered": rendered}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/templates/{template_id}", response_model=TemplateResponse, tags=["templates"])
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a template"""
    try:
        service = TemplateService(db)
        updates = template_data.model_dump(exclude_unset=True)
        template = await service.update_template(
            template_id=template_id,
            user_id=current_user.id,
            updates=updates
        )
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        return TemplateResponse.model_validate(template)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/templates/{template_id}", tags=["templates"])
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a template"""
    try:
        service = TemplateService(db)
        success = await service.delete_template(template_id, current_user.id)
        if success:
            return {"success": True, "message": "Template deleted successfully"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/templates/{template_id}/duplicate", response_model=TemplateResponse, tags=["templates"])
async def duplicate_template(
    template_id: int,
    new_name: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Duplicate a template"""
    service = TemplateService(db)
    template = await service.duplicate_template(template_id, current_user.id, new_name)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return TemplateResponse.model_validate(template)




