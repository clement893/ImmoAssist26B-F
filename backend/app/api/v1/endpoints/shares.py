"""
Sharing & Permissions API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from pydantic import BaseModel, Field

from app.services.share_service import ShareService
from app.models.user import User
from app.models.share import PermissionLevel
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from datetime import datetime

router = APIRouter()


class ShareCreate(BaseModel):
    entity_type: str = Field(..., description="Entity type (e.g., 'project', 'file')")
    entity_id: int = Field(..., description="ID of the entity to share")
    shared_with_type: str = Field(..., description="'user' or 'team'")
    shared_with_id: int = Field(..., description="User ID or Team ID")
    permission_level: PermissionLevel = Field(PermissionLevel.VIEW, description="Permission level")
    expires_at: Optional[str] = Field(None, description="Expiration date (ISO format)")
    requires_password: bool = Field(False)
    password: Optional[str] = Field(None, description="Password if requires_password is True")
    is_public_link: bool = Field(False, description="Create public share link")


class ShareUpdate(BaseModel):
    permission_level: Optional[PermissionLevel] = None
    expires_at: Optional[str] = None


class ShareResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    shared_with_type: str
    shared_with_id: int
    permission_level: PermissionLevel
    created_by_id: int
    expires_at: Optional[str]
    requires_password: bool
    is_public_link: bool
    share_token: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.post("/shares", response_model=ShareResponse, status_code=status.HTTP_201_CREATED, tags=["shares"])
async def create_share(
    share_data: ShareCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new share"""
    try:
        service = ShareService(db)
        
        expires_at = None
        if share_data.expires_at:
            expires_at = datetime.fromisoformat(share_data.expires_at.replace('Z', '+00:00'))
        
        share = await service.create_share(
            entity_type=share_data.entity_type,
            entity_id=share_data.entity_id,
            shared_with_type=share_data.shared_with_type,
            shared_with_id=share_data.shared_with_id,
            permission_level=share_data.permission_level,
            created_by_id=current_user.id,
            expires_at=expires_at,
            requires_password=share_data.requires_password,
            password=share_data.password,
            is_public_link=share_data.is_public_link
        )
        return ShareResponse.model_validate(share)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/shares/entity/{entity_type}/{entity_id}", response_model=List[ShareResponse], tags=["shares"])
async def get_entity_shares(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all shares for an entity"""
    service = ShareService(db)
    shares = await service.get_shares_for_entity(entity_type, entity_id)
    return [ShareResponse.model_validate(s) for s in shares]


@router.get("/shares/my", response_model=List[ShareResponse], tags=["shares"])
async def get_my_shares(
    entity_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all shares for the current user"""
    service = ShareService(db)
    shares = await service.get_user_shares(current_user.id, entity_type)
    return [ShareResponse.model_validate(s) for s in shares]


@router.get("/shares/token/{share_token}", response_model=ShareResponse, tags=["shares"])
async def get_share_by_token(
    share_token: str,
    password: Optional[str] = Query(None, description="Password if share requires it"),
    db: AsyncSession = Depends(get_db),
):
    """Get a share by public token"""
    service = ShareService(db)
    share = await service.get_share_by_token(share_token)
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found or expired"
        )
    
    # Verify password if required
    if share.requires_password:
        if not password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password required"
            )
        if not await service.verify_share_password(share.id, password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
    
    return ShareResponse.model_validate(share)


@router.put("/shares/{share_id}", response_model=ShareResponse, tags=["shares"])
async def update_share(
    share_id: int,
    share_data: ShareUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a share"""
    try:
        service = ShareService(db)
        
        expires_at = None
        if share_data.expires_at:
            expires_at = datetime.fromisoformat(share_data.expires_at.replace('Z', '+00:00'))
        
        share = await service.update_share(
            share_id=share_id,
            permission_level=share_data.permission_level,
            expires_at=expires_at,
            created_by_id=current_user.id
        )
        if not share:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share not found"
            )
        return ShareResponse.model_validate(share)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/shares/{share_id}", tags=["shares"])
async def delete_share(
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a share"""
    try:
        service = ShareService(db)
        success = await service.delete_share(share_id, current_user.id)
        if success:
            return {"success": True, "message": "Share deleted successfully"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/shares/check-permission", tags=["shares"])
async def check_permission(
    entity_type: str = Query(...),
    entity_id: int = Query(...),
    required_permission: PermissionLevel = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if current user has required permission"""
    service = ShareService(db)
    has_permission = await service.check_permission(
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=current_user.id,
        required_permission=required_permission
    )
    return {"has_permission": has_permission}




