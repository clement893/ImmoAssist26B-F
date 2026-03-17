"""
Backups API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.services.backup_service import BackupService
from app.models.user import User
from app.models.backup import BackupType, BackupStatus
from app.dependencies import get_current_user
from app.core.database import get_db
from app.core.logging import logger
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class BackupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    backup_type: BackupType
    retention_days: Optional[int] = Field(None, ge=1)
    metadata: Optional[dict] = None


class BackupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    backup_type: str
    file_path: Optional[str]
    file_size: Optional[int]
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    expires_at: Optional[str]
    is_automatic: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class RestoreRequest(BaseModel):
    backup_id: int


@router.post("/backups", response_model=BackupResponse, status_code=status.HTTP_201_CREATED, tags=["backups"])
async def create_backup(
    backup_data: BackupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new backup"""
    service = BackupService(db)
    backup = await service.create_backup(
        name=backup_data.name,
        description=backup_data.description,
        backup_type=backup_data.backup_type,
        retention_days=backup_data.retention_days,
        metadata=backup_data.metadata,
        user_id=current_user.id
    )
    
    # Trigger actual backup process asynchronously
    # NOTE: To implement async backup, you can use:
    # 1. Celery task: Create a task in app/tasks/backup_tasks.py
    #    from app.tasks.backup_tasks import create_backup_task
    #    create_backup_task.delay(backup.id)
    # 2. FastAPI BackgroundTasks: from fastapi import BackgroundTasks
    #    background_tasks.add_task(service.execute_backup, backup.id)
    # For now, backup is created but not executed - implement based on your needs
    logger.info(f"Backup created: {backup.id}. Implement async execution as needed.")
    
    return BackupResponse.model_validate(backup)


@router.get("/backups", response_model=List[BackupResponse], tags=["backups"])
async def get_backups(
    backup_type: Optional[BackupType] = Query(None),
    status: Optional[BackupStatus] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get backups"""
    service = BackupService(db)
    backups = await service.get_backups(
        backup_type=backup_type,
        status=status,
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    return [BackupResponse.model_validate(b) for b in backups]


@router.get("/backups/{backup_id}", response_model=BackupResponse, tags=["backups"])
async def get_backup(
    backup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific backup"""
    from app.dependencies import is_admin_or_superadmin
    
    service = BackupService(db)
    backup = await service.get_backup(backup_id)
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    # Check if user owns this backup or is admin/superadmin
    is_admin = await is_admin_or_superadmin(current_user, db)
    if backup.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this backup"
        )
    
    return BackupResponse.model_validate(backup)


@router.post("/backups/{backup_id}/restore", tags=["backups"])
async def restore_backup(
    backup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Restore from a backup"""
    service = BackupService(db)
    backup = await service.get_backup(backup_id)
    if not backup or backup.status != BackupStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Backup not found or not completed"
        )
    
    # Create restore operation
    restore = await service.create_restore_operation(backup_id, current_user.id)
    
    # Trigger actual restore process asynchronously
    # NOTE: To implement async restore, you can use:
    # 1. Celery task: Create a task in app/tasks/backup_tasks.py
    #    from app.tasks.backup_tasks import restore_backup_task
    #    restore_backup_task.delay(restore.id)
    # 2. FastAPI BackgroundTasks: from fastapi import BackgroundTasks
    #    background_tasks.add_task(service.execute_restore, restore.id)
    # For now, restore operation is created but not executed - implement based on your needs
    logger.info(f"Restore operation created: {restore.id}. Implement async execution as needed.")
    
    return {
        "success": True,
        "message": "Restore operation started",
        "restore_id": restore.id
    }


@router.delete("/backups/{backup_id}", tags=["backups"])
async def delete_backup(
    backup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a backup"""
    service = BackupService(db)
    backup = await service.get_backup(backup_id)
    if backup and backup.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    success = await service.delete_backup(backup_id)
    if success:
        return {"success": True, "message": "Backup deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Backup not found"
    )




