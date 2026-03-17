"""
Menus API Endpoints
Navigation menus management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.menu import Menu
from app.models.user import User
from app.dependencies import get_current_user, get_db, is_superadmin
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.core.tenancy_helpers import apply_tenant_scope
from fastapi import Request

router = APIRouter()


class MenuItem(BaseModel):
    id: str
    label: str
    url: str
    target: Optional[str] = '_self'
    children: Optional[List['MenuItem']] = None


class MenuCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    location: str = Field(..., pattern='^(header|footer|sidebar)$')
    items: List[MenuItem] = Field(default_factory=list)


class MenuUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    location: Optional[str] = Field(None, pattern='^(header|footer|sidebar)$')
    items: Optional[List[MenuItem]] = None


class MenuResponse(BaseModel):
    id: int
    name: str
    location: str
    items: List[dict]
    user_id: Optional[int] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.get("/menus", response_model=List[MenuResponse], tags=["menus"])
async def list_menus(
    location: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all menus"""
    query = select(Menu)
    if location:
        query = query.where(Menu.location == location)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Menu)
    result = await db.execute(query.order_by(Menu.created_at.desc()))
    menus = result.scalars().all()
    return [MenuResponse.model_validate(menu) for menu in menus]


@router.get("/menus/{menu_id}", response_model=MenuResponse, tags=["menus"])
async def get_menu(
    menu_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a menu by ID"""
    query = select(Menu).where(Menu.id == menu_id)
    # Apply tenant scoping if tenancy is enabled
    query = apply_tenant_scope(query, Menu)
    result = await db.execute(query)
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    
    return MenuResponse.model_validate(menu)


@router.post("/menus", response_model=MenuResponse, status_code=status.HTTP_201_CREATED, tags=["menus"])
async def create_menu(
    request: Request,
    menu_data: MenuCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new menu"""
    items_json = [item.model_dump() for item in menu_data.items]
    
    menu = Menu(
        name=menu_data.name,
        location=menu_data.location,
        items=items_json,
        user_id=current_user.id,
    )
    
    db.add(menu)
    await db.commit()
    await db.refresh(menu)
    
    # Log data modification
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description=f"Menu '{menu.name}' created",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "menu", "menu_id": menu.id, "action": "created"}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails
    
    return MenuResponse.model_validate(menu)


@router.put("/menus/{menu_id}", response_model=MenuResponse, tags=["menus"])
async def update_menu(
    request: Request,
    menu_id: int,
    menu_data: MenuUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a menu"""
    result = await db.execute(select(Menu).where(Menu.id == menu_id))
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    
    # Check ownership or admin
    if menu.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this menu"
        )
    
    if menu_data.name is not None:
        menu.name = menu_data.name
    if menu_data.location is not None:
        menu.location = menu_data.location
    if menu_data.items is not None:
        menu.items = [item.model_dump() for item in menu_data.items]
    
    await db.commit()
    await db.refresh(menu)
    
    # Log data modification
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_MODIFIED,
            description=f"Menu '{menu.name}' updated",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "menu", "menu_id": menu.id, "action": "updated"}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails
    
    return MenuResponse.model_validate(menu)


@router.delete("/menus/{menu_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["menus"])
async def delete_menu(
    request: Request,
    menu_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a menu"""
    query = select(Menu).where(Menu.id == menu_id)
    query = apply_tenant_scope(query, Menu)
    result = await db.execute(query)
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    
    # Check ownership or admin
    if menu.user_id != current_user.id and not await is_superadmin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this menu"
        )
    
    menu_name = menu.name  # Save before deletion
    await db.delete(menu)
    await db.commit()
    
    # Log data deletion
    try:
        await SecurityAuditLogger.log_event(
            db=db,
            event_type=SecurityEventType.DATA_DELETED,
            description=f"Menu '{menu_name}' deleted",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_method=request.method,
            request_path=str(request.url.path),
            severity="info",
            success="success",
            metadata={"resource_type": "menu", "menu_id": menu_id, "action": "deleted"}
        )
    except Exception:
        pass  # Don't fail request if audit logging fails

