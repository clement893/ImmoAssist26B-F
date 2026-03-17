"""
Scheduled Tasks API Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.scheduled_task_service import ScheduledTaskService
from app.models.user import User
from app.models.scheduled_task import TaskType, TaskStatus
from app.dependencies import get_current_user
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class TaskCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    task_type: TaskType
    scheduled_at: datetime
    recurrence: Optional[str] = None
    recurrence_config: Optional[dict] = None
    task_data: Optional[dict] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    recurrence: Optional[str] = None
    recurrence_config: Optional[dict] = None
    task_data: Optional[dict] = None


class TaskResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    task_type: str
    scheduled_at: str
    recurrence: Optional[str]
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ExecutionLogResponse(BaseModel):
    id: int
    task_id: int
    status: str
    started_at: str
    completed_at: Optional[str]
    duration_seconds: Optional[int]
    error_message: Optional[str]

    class Config:
        from_attributes = True


@router.post("/scheduled-tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["scheduled-tasks"])
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new scheduled task"""
    service = ScheduledTaskService(db)
    task = await service.create_task(
        name=task_data.name,
        description=task_data.description,
        task_type=task_data.task_type,
        scheduled_at=task_data.scheduled_at,
        recurrence=task_data.recurrence,
        recurrence_config=task_data.recurrence_config,
        task_data=task_data.task_data,
        user_id=current_user.id
    )
    return TaskResponse.model_validate(task)


@router.get("/scheduled-tasks", response_model=List[TaskResponse], tags=["scheduled-tasks"])
async def get_tasks(
    status: Optional[TaskStatus] = Query(None),
    task_type: Optional[TaskType] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get scheduled tasks for the current user"""
    service = ScheduledTaskService(db)
    tasks = await service.get_user_tasks(
        current_user.id,
        status=status,
        task_type=task_type
    )
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get("/scheduled-tasks/{task_id}", response_model=TaskResponse, tags=["scheduled-tasks"])
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific scheduled task"""
    from app.dependencies import is_admin_or_superadmin
    
    service = ScheduledTaskService(db)
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user owns this task or is admin/superadmin
    is_admin = await is_admin_or_superadmin(current_user, db)
    if task.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this task"
        )
    
    return TaskResponse.model_validate(task)


@router.get("/scheduled-tasks/{task_id}/logs", response_model=List[ExecutionLogResponse], tags=["scheduled-tasks"])
async def get_task_logs(
    task_id: int,
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get execution logs for a task"""
    service = ScheduledTaskService(db)
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    logs = await service.get_execution_logs(task_id, limit=limit)
    return [ExecutionLogResponse.model_validate(l) for l in logs]


@router.put("/scheduled-tasks/{task_id}", response_model=TaskResponse, tags=["scheduled-tasks"])
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a scheduled task"""
    service = ScheduledTaskService(db)
    task = await service.get_task(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Update task fields
    updates = task_data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if hasattr(task, key) and value is not None:
            setattr(task, key, value)
    
    await db.commit()
    await db.refresh(task)
    
    return TaskResponse.model_validate(task)


@router.post("/scheduled-tasks/{task_id}/cancel", tags=["scheduled-tasks"])
async def cancel_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending task"""
    service = ScheduledTaskService(db)
    task = await service.cancel_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or cannot be cancelled"
        )
    
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return {"success": True, "message": "Task cancelled"}


@router.delete("/scheduled-tasks/{task_id}", tags=["scheduled-tasks"])
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a scheduled task"""
    service = ScheduledTaskService(db)
    task = await service.get_task(task_id)
    if task and task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    success = await service.delete_task(task_id)
    if success:
        return {"success": True, "message": "Task deleted successfully"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Task not found"
    )


@router.put("/content/schedule/{task_id}/toggle", response_model=TaskResponse, tags=["scheduled-tasks"])
async def toggle_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Toggle task active status (enable/disable).
    Toggles between PENDING (enabled) and CANCELLED (disabled) states.
    """
    from app.dependencies import is_admin_or_superadmin
    
    service = ScheduledTaskService(db)
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user owns this task or is admin/superadmin
    is_admin = await is_admin_or_superadmin(current_user, db)
    if task.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to toggle this task"
        )
    
    # Toggle between PENDING (enabled) and CANCELLED (disabled)
    if task.status == TaskStatus.PENDING:
        # Cancel the task (disable)
        task = await service.cancel_task(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot toggle task status"
            )
    elif task.status == TaskStatus.CANCELLED:
        # Re-enable the task by setting status back to pending
        task.status = TaskStatus.PENDING
        await db.commit()
        await db.refresh(task)
    elif task.status in [TaskStatus.RUNNING, TaskStatus.COMPLETED, TaskStatus.FAILED]:
        # For other statuses, cannot toggle
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot toggle task with status '{task.status.value}'. Only PENDING or CANCELLED tasks can be toggled."
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown task status: '{task.status}'"
        )
    
    return TaskResponse.model_validate(task)




