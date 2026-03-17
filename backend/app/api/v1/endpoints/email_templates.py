"""
Email Templates API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from pydantic import BaseModel, Field

from app.services.email_template_service import EmailTemplateService
from app.models.user import User
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class TemplateCreate(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(..., min_length=1, max_length=200)
    html_body: str = Field(..., min_length=1)
    text_body: Optional[str] = None
    category: Optional[str] = None
    variables: Optional[List[str]] = None
    language: str = Field('en', max_length=10)
    description: Optional[str] = None
    is_active: bool = True


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    subject: Optional[str] = Field(None, min_length=1, max_length=200)
    html_body: Optional[str] = Field(None, min_length=1)
    text_body: Optional[str] = None
    category: Optional[str] = None
    variables: Optional[List[str]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateRender(BaseModel):
    variables: dict = Field(..., description="Template variables")


class TemplateResponse(BaseModel):
    id: int
    key: str
    name: str
    category: Optional[str]
    subject: str
    html_body: str
    text_body: Optional[str]
    variables: Optional[List[str]]
    is_active: bool
    is_system: bool
    language: str
    description: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class VersionResponse(BaseModel):
    id: int
    template_id: int
    version_number: int
    subject: str
    html_body: str
    text_body: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.post("/email-templates", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED, tags=["email-templates"])
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new email template"""
    service = EmailTemplateService(db)
    try:
        template = await service.create_template(
            key=template_data.key,
            name=template_data.name,
            subject=template_data.subject,
            html_body=template_data.html_body,
            text_body=template_data.text_body,
            category=template_data.category,
            variables=template_data.variables,
            language=template_data.language,
            description=template_data.description,
            is_active=template_data.is_active,
            created_by_id=current_user.id
        )
        return TemplateResponse.model_validate(template)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/email-templates", response_model=List[TemplateResponse], tags=["email-templates"])
async def get_templates(
    category: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all email templates"""
    service = EmailTemplateService(db)
    templates = await service.get_all_templates(
        category=category,
        language=language,
        active_only=active_only
    )
    return [TemplateResponse.model_validate(t) for t in templates]


@router.get("/email-templates/{key}", response_model=TemplateResponse, tags=["email-templates"])
async def get_template(
    key: str,
    language: str = Query('en'),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get an email template by key"""
    service = EmailTemplateService(db)
    template = await service.get_template(key, language=language)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return TemplateResponse.model_validate(template)


@router.post("/email-templates/{key}/render", tags=["email-templates"])
async def render_template(
    key: str,
    render_data: TemplateRender = Body(...),
    language: str = Query('en'),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Render an email template with variables"""
    service = EmailTemplateService(db)
    rendered = await service.render_template(key, render_data.variables, language=language)
    if not rendered:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or inactive"
        )
    return rendered


@router.put("/email-templates/{template_id}", response_model=TemplateResponse, tags=["email-templates"])
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an email template"""
    service = EmailTemplateService(db)
    updates = template_data.model_dump(exclude_unset=True)
    template = await service.update_template(template_id, updates, created_by_id=current_user.id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return TemplateResponse.model_validate(template)


@router.get("/email-templates/{template_id}/versions", response_model=List[VersionResponse], tags=["email-templates"])
async def get_template_versions(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get version history for a template"""
    service = EmailTemplateService(db)
    versions = await service.get_template_versions(template_id)
    return [VersionResponse.model_validate(v) for v in versions]


@router.delete("/email-templates/{template_id}", tags=["email-templates"])
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an email template"""
    service = EmailTemplateService(db)
    try:
        success = await service.delete_template(template_id)
        if success:
            return {"success": True, "message": "Template deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Template not found"
    )




