"""
Scheduled Task Service
Manages scheduled tasks and background jobs
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_task import ScheduledTask, TaskExecutionLog, TaskStatus, TaskType
from app.core.logging import logger


class ScheduledTaskService:
    """Service for scheduled task operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(
        self,
        name: str,
        task_type: TaskType,
        scheduled_at: datetime,
        description: Optional[str] = None,
        recurrence: Optional[str] = None,
        recurrence_config: Optional[Dict[str, Any]] = None,
        task_data: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None
    ) -> ScheduledTask:
        """Create a new scheduled task"""
        task = ScheduledTask(
            name=name,
            description=description,
            task_type=task_type,
            scheduled_at=scheduled_at,
            recurrence=recurrence,
            recurrence_config=recurrence_config,
            task_data=task_data,
            user_id=user_id
        )
        
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        
        return task

    async def get_task(self, task_id: int) -> Optional[ScheduledTask]:
        """Get a task by ID"""
        return await self.db.get(ScheduledTask, task_id)

    async def get_pending_tasks(self, limit: int = 100) -> List[ScheduledTask]:
        """Get pending tasks that are due"""
        now = datetime.utcnow()
        result = await self.db.execute(
            select(ScheduledTask).where(
                and_(
                    ScheduledTask.status == TaskStatus.PENDING,
                    ScheduledTask.scheduled_at <= now
                )
            ).order_by(ScheduledTask.scheduled_at).limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_tasks(
        self,
        user_id: int,
        status: Optional[TaskStatus] = None,
        task_type: Optional[TaskType] = None
    ) -> List[ScheduledTask]:
        """Get tasks for a user"""
        query = select(ScheduledTask).where(ScheduledTask.user_id == user_id)
        
        if status:
            query = query.where(ScheduledTask.status == status)
        
        if task_type:
            query = query.where(ScheduledTask.task_type == task_type)
        
        result = await self.db.execute(query.order_by(desc(ScheduledTask.scheduled_at)))
        return list(result.scalars().all())

    async def update_task_status(
        self,
        task_id: int,
        status: TaskStatus,
        error_message: Optional[str] = None,
        result_data: Optional[Dict[str, Any]] = None
    ) -> Optional[ScheduledTask]:
        """Update task status"""
        task = await self.get_task(task_id)
        if not task:
            return None
        
        task.status = status
        
        if status == TaskStatus.RUNNING:
            task.started_at = datetime.utcnow()
        elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
            task.completed_at = datetime.utcnow()
            if error_message:
                task.error_message = error_message
            if result_data:
                task.result_data = result_data
        
        # If recurring, schedule next occurrence
        if status == TaskStatus.COMPLETED and task.recurrence:
            await self._schedule_next_occurrence(task)
        
        await self.db.commit()
        await self.db.refresh(task)
        
        return task

    async def _schedule_next_occurrence(self, task: ScheduledTask) -> None:
        """Schedule the next occurrence of a recurring task"""
        if not task.recurrence:
            return
        
        next_scheduled = None
        
        if task.recurrence == 'daily':
            next_scheduled = task.scheduled_at + timedelta(days=1)
        elif task.recurrence == 'weekly':
            next_scheduled = task.scheduled_at + timedelta(weeks=1)
        elif task.recurrence == 'monthly':
            # Simple monthly: add 30 days
            next_scheduled = task.scheduled_at + timedelta(days=30)
        elif task.recurrence == 'cron':
            # Handle cron expressions
            # NOTE: To fully implement cron expressions, install croniter:
            # pip install croniter
            # Then use: from croniter import croniter
            # cron = croniter(task.recurrence_config.get('expression', '0 0 * * *'), task.scheduled_at)
            # next_scheduled = cron.get_next(datetime)
            # For now, we'll log a warning and skip scheduling
            logger.warning(
                f"Cron expressions not yet fully implemented for task {task.id}. "
                "Install croniter and update this code to parse cron expressions."
            )
            # Fallback: don't schedule next occurrence
            return
        
        if next_scheduled:
            # Create new task instance for next occurrence
            new_task = ScheduledTask(
                name=task.name,
                description=task.description,
                task_type=task.task_type,
                scheduled_at=next_scheduled,
                recurrence=task.recurrence,
                recurrence_config=task.recurrence_config,
                task_data=task.task_data,
                user_id=task.user_id
            )
            self.db.add(new_task)
            await self.db.commit()

    async def log_execution(
        self,
        task_id: int,
        status: TaskStatus,
        started_at: datetime,
        completed_at: Optional[datetime] = None,
        error_message: Optional[str] = None,
        result_data: Optional[Dict[str, Any]] = None
    ) -> TaskExecutionLog:
        """Log task execution"""
        duration_seconds = None
        if completed_at:
            duration_seconds = int((completed_at - started_at).total_seconds())
        
        log = TaskExecutionLog(
            task_id=task_id,
            status=status,
            started_at=started_at,
            completed_at=completed_at,
            duration_seconds=duration_seconds,
            error_message=error_message,
            result_data=result_data
        )
        
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        
        return log

    async def cancel_task(self, task_id: int) -> Optional[ScheduledTask]:
        """Cancel a pending task"""
        task = await self.get_task(task_id)
        if not task or task.status != TaskStatus.PENDING:
            return None
        
        task.status = TaskStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(task)
        
        return task

    async def delete_task(self, task_id: int) -> bool:
        """Delete a task"""
        task = await self.get_task(task_id)
        if not task:
            return False
        
        await self.db.delete(task)
        await self.db.commit()
        
        return True

    async def get_execution_logs(
        self,
        task_id: int,
        limit: int = 50
    ) -> List[TaskExecutionLog]:
        """Get execution logs for a task"""
        result = await self.db.execute(
            select(TaskExecutionLog).where(
                TaskExecutionLog.task_id == task_id
            ).order_by(desc(TaskExecutionLog.started_at)).limit(limit)
        )
        return list(result.scalars().all())

