"""
API Key Management Endpoints
Allows users to generate and manage API keys with rotation policies
"""

from typing import Annotated, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.rate_limit import rate_limit_decorator
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.models.user import User
from app.models.api_key import APIKey
from app.api.v1.endpoints.auth import get_current_user
from app.services.api_key_service import APIKeyService, APIKeyRotationPolicy
from app.dependencies import require_admin_or_superadmin
from sqlalchemy import select
from sqlalchemy.orm import selectinload

router = APIRouter()


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    rotation_policy: str = Field(
        default="manual",
        description="Rotation policy: manual, 30d, 60d, 90d, 180d, 365d"
    )
    expires_in_days: Optional[int] = Field(None, ge=1, le=3650, description="Expiration in days (optional)")


class APIKeyResponse(BaseModel):
    id: int
    name: str
    key: str  # Only shown once on creation
    key_prefix: str
    created_at: str
    expires_at: Optional[str] = None
    last_used_at: Optional[str] = None
    rotation_policy: str
    next_rotation_at: Optional[str] = None


class APIKeyListResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    created_at: str
    expires_at: Optional[str] = None
    last_used_at: Optional[str] = None
    rotation_policy: str
    next_rotation_at: Optional[str] = None
    rotation_count: int
    usage_count: int
    is_active: bool


class AdminAPIKeyListResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    created_at: str
    expires_at: Optional[str] = None
    last_used_at: Optional[str] = None
    rotation_policy: str
    next_rotation_at: Optional[str] = None
    rotation_count: int
    usage_count: int
    is_active: bool
    user_id: int
    user_email: str
    user_name: Optional[str] = None


class APIKeyRotateResponse(BaseModel):
    old_key_id: int
    new_key: APIKeyResponse
    message: str


@router.post("/generate", response_model=APIKeyResponse)
@rate_limit_decorator("5/minute")
async def generate_api_key_endpoint(
    request: Request,
    api_key_data: APIKeyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate a new API key for the current user"""
    # Validate rotation policy
    if not APIKeyRotationPolicy.is_valid_policy(api_key_data.rotation_policy):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rotation policy. Valid options: {', '.join(APIKeyRotationPolicy.POLICIES.keys())}"
        )
    
    # Create API key
    api_key_model, plaintext_key = await APIKeyService.create_api_key(
        db=db,
        user=current_user,
        name=api_key_data.name,
        description=api_key_data.description,
        rotation_policy=api_key_data.rotation_policy,
        expires_in_days=api_key_data.expires_in_days,
    )
    
    # Log security event
    await SecurityAuditLogger.log_api_key_event(
        db=db,
        event_type=SecurityEventType.API_KEY_CREATED,
        api_key_id=api_key_model.id,
        description=f"API key '{api_key_data.name}' created",
        user_id=current_user.id,
        user_email=current_user.email,
        ip_address=request.client.host if request.client else None,
        metadata={
            "rotation_policy": api_key_data.rotation_policy,
            "expires_in_days": api_key_data.expires_in_days,
        }
    )
    
    return APIKeyResponse(
        id=api_key_model.id,
        name=api_key_model.name,
        key=plaintext_key,  # Only time this is shown
        key_prefix=api_key_model.key_prefix,
        created_at=api_key_model.created_at.isoformat(),
        expires_at=api_key_model.expires_at.isoformat() if api_key_model.expires_at else None,
        last_used_at=api_key_model.last_used_at.isoformat() if api_key_model.last_used_at else None,
        rotation_policy=api_key_model.rotation_policy,
        next_rotation_at=api_key_model.next_rotation_at.isoformat() if api_key_model.next_rotation_at else None,
    )


@router.get("/list", response_model=List[APIKeyListResponse])
@rate_limit_decorator("10/minute")
async def list_api_keys(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    include_inactive: bool = False,
):
    """List all API keys for the current user"""
    api_keys = await APIKeyService.get_user_api_keys(
        db=db,
        user=current_user,
        include_inactive=include_inactive,
    )
    
    return [
        APIKeyListResponse(
            id=key.id,
            name=key.name,
            key_prefix=key.key_prefix,
            created_at=key.created_at.isoformat(),
            expires_at=key.expires_at.isoformat() if key.expires_at else None,
            last_used_at=key.last_used_at.isoformat() if key.last_used_at else None,
            rotation_policy=key.rotation_policy,
            next_rotation_at=key.next_rotation_at.isoformat() if key.next_rotation_at else None,
            rotation_count=key.rotation_count,
            usage_count=key.usage_count,
            is_active=key.is_active,
        )
        for key in api_keys
    ]


@router.post("/{key_id}/rotate", response_model=APIKeyRotateResponse)
@rate_limit_decorator("5/minute")
async def rotate_api_key(
    request: Request,
    key_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Rotate an API key (creates new key, deactivates old one)"""
    try:
        new_key_model, plaintext_key = await APIKeyService.rotate_api_key(
            db=db,
            api_key_id=key_id,
            user=current_user,
        )
        
        # Log security event
        await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_ROTATED,
            api_key_id=new_key_model.id,
            description=f"API key rotated (old: {key_id}, new: {new_key_model.id})",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            metadata={
                "old_key_id": key_id,
                "new_key_id": new_key_model.id,
            }
        )
        
        return APIKeyRotateResponse(
            old_key_id=key_id,
            new_key=APIKeyResponse(
                id=new_key_model.id,
                name=new_key_model.name,
                key=plaintext_key,  # Only time this is shown
                key_prefix=new_key_model.key_prefix,
                created_at=new_key_model.created_at.isoformat(),
                expires_at=new_key_model.expires_at.isoformat() if new_key_model.expires_at else None,
                last_used_at=new_key_model.last_used_at.isoformat() if new_key_model.last_used_at else None,
                rotation_policy=new_key_model.rotation_policy,
                next_rotation_at=new_key_model.next_rotation_at.isoformat() if new_key_model.next_rotation_at else None,
            ),
            message="API key rotated successfully. Old key has been deactivated.",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{key_id}")
@rate_limit_decorator("10/minute")
async def revoke_api_key(
    request: Request,
    key_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    reason: Optional[str] = None,
):
    """Revoke an API key"""
    try:
        api_key = await APIKeyService.revoke_api_key(
            db=db,
            api_key_id=key_id,
            user=current_user,
            reason=reason,
        )
        
        # Log security event
        await SecurityAuditLogger.log_api_key_event(
            db=db,
            event_type=SecurityEventType.API_KEY_REVOKED,
            api_key_id=api_key.id,
            description=f"API key '{api_key.name}' revoked",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            metadata={
                "reason": reason,
            }
        )
        
        return {"message": "API key revoked successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/admin/list", response_model=List[AdminAPIKeyListResponse])
@rate_limit_decorator("20/minute")
async def admin_list_all_api_keys(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    _: None = Depends(require_admin_or_superadmin),
    include_inactive: bool = False,
    user_id: Optional[int] = None,
):
    """List all API keys (admin only). Can filter by user_id."""
    # Build query
    query = select(APIKey)
    
    if user_id:
        query = query.where(APIKey.user_id == user_id)
    
    if not include_inactive:
        query = query.where(APIKey.is_active == True)
    
    query = query.order_by(APIKey.created_at.desc())
    
    # Load user relationship
    query = query.options(selectinload(APIKey.user))
    
    result = await db.execute(query)
    api_keys = result.scalars().all()
    
    return [
        AdminAPIKeyListResponse(
            id=key.id,
            name=key.name,
            key_prefix=key.key_prefix,
            created_at=key.created_at.isoformat(),
            expires_at=key.expires_at.isoformat() if key.expires_at else None,
            last_used_at=key.last_used_at.isoformat() if key.last_used_at else None,
            rotation_policy=key.rotation_policy,
            next_rotation_at=key.next_rotation_at.isoformat() if key.next_rotation_at else None,
            rotation_count=key.rotation_count,
            usage_count=key.usage_count,
            is_active=key.is_active,
            user_id=key.user_id,
            user_email=key.user.email if key.user else "Unknown",
            user_name=f"{key.user.first_name or ''} {key.user.last_name or ''}".strip() if key.user else None,
        )
        for key in api_keys
    ]

