"""
Announcements API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.announcement_service import AnnouncementService
from app.models.user import User
from app.models.announcement import AnnouncementType, AnnouncementPriority
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    type: AnnouncementType = AnnouncementType.INFO
    priority: AnnouncementPriority = AnnouncementPriority.MEDIUM
    is_active: bool = True
    is_dismissible: bool = True
    show_on_login: bool = False
    show_in_app: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_users: Optional[List[int]] = None
    target_teams: Optional[List[int]] = None
    target_roles: Optional[List[str]] = None
    action_label: Optional[str] = None
    action_url: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    message: Optional[str] = Field(None, min_length=1)
    type: Optional[AnnouncementType] = None
    priority: Optional[AnnouncementPriority] = None
    is_active: Optional[bool] = None
    is_dismissible: Optional[bool] = None
    show_on_login: Optional[bool] = None
    show_in_app: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_users: Optional[List[int]] = None
    target_teams: Optional[List[int]] = None
    target_roles: Optional[List[str]] = None
    action_label: Optional[str] = None
    action_url: Optional[str] = None


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    priority: str
    is_active: bool
    is_dismissible: bool
    show_on_login: bool
    show_in_app: bool
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    action_label: Optional[str]
    action_url: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED, tags=["announcements"])
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new announcement"""
    service = AnnouncementService(db)
    announcement = await service.create_announcement(
        title=announcement_data.title,
        message=announcement_data.message,
        type=announcement_data.type,
        priority=announcement_data.priority,
        is_active=announcement_data.is_active,
        is_dismissible=announcement_data.is_dismissible,
        show_on_login=announcement_data.show_on_login,
        show_in_app=announcement_data.show_in_app,
        start_date=announcement_data.start_date,
        end_date=announcement_data.end_date,
        target_users=announcement_data.target_users,
        target_teams=announcement_data.target_teams,
        target_roles=announcement_data.target_roles,
        action_label=announcement_data.action_label,
        action_url=announcement_data.action_url,
        created_by_id=current_user.id
    )
    return AnnouncementResponse.model_validate(announcement)


@router.get("/announcements", response_model=List[AnnouncementResponse], tags=["announcements"])
async def get_announcements(
    show_on_login: Optional[bool] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get active announcements for the current user"""
    service = AnnouncementService(db)
    
    from app.services.rbac_service import RBACService
    from app.core.tenancy import get_user_tenant_id
    
    user_id = current_user.id if current_user else None
    # Get user team_id from tenancy context
    user_team_id = await get_user_tenant_id(current_user.id, db) if current_user else None
    # Get user roles from RBAC service
    if current_user:
        rbac_service = RBACService(db)
        user_roles_objects = await rbac_service.get_user_roles(current_user.id)
        user_roles = [role.slug for role in user_roles_objects] if user_roles_objects else None
    else:
        user_roles = None
    
    announcements = await service.get_active_announcements(
        user_id=user_id,
        user_team_id=user_team_id,
        user_roles=user_roles,
        show_on_login=show_on_login
    )
    
    return [AnnouncementResponse.model_validate(a) for a in announcements]


@router.post("/announcements/{announcement_id}/dismiss", tags=["announcements"])
async def dismiss_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dismiss an announcement"""
    service = AnnouncementService(db)
    dismissal = await service.dismiss_announcement(announcement_id, current_user.id)
    return {"success": True, "message": "Announcement dismissed"}


@router.put("/announcements/{announcement_id}", response_model=AnnouncementResponse, tags=["announcements"])
async def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an announcement"""
    service = AnnouncementService(db)
    updates = announcement_data.model_dump(exclude_unset=True)
    announcement = await service.update_announcement(announcement_id, updates)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    return AnnouncementResponse.model_validate(announcement)


@router.delete("/announcements/{announcement_id}", tags=["announcements"])
async def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an announcement"""
    service = AnnouncementService(db)
    success = await service.delete_announcement(announcement_id)
    if success:
        return {"success": True, "message": "Announcement deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Announcement not found"
    )




