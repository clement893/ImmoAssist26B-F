"""
Scheduled Task Model
Background tasks and scheduled jobs
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    """Task status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskType(str, enum.Enum):
    """Task type"""
    EMAIL = "email"
    REPORT = "report"
    CLEANUP = "cleanup"
    BACKUP = "backup"
    SYNC = "sync"
    CUSTOM = "custom"


class ScheduledTask(Base):
    """Scheduled task model"""
    
    __tablename__ = "scheduled_tasks"
    __table_args__ = (
        Index("idx_scheduled_tasks_status", "status"),
        Index("idx_scheduled_tasks_type", "task_type"),
        Index("idx_scheduled_tasks_scheduled_at", "scheduled_at"),
        Index("idx_scheduled_tasks_user", "user_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(SQLEnum(TaskType), nullable=False, index=True)
    
    # Scheduling
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    recurrence = Column(String(50), nullable=True)  # 'daily', 'weekly', 'monthly', 'cron', null for one-time
    recurrence_config = Column(JSON, nullable=True)  # Additional recurrence configuration
    
    # Execution
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Task configuration
    task_data = Column(JSON, nullable=True)  # Task-specific configuration
    result_data = Column(JSON, nullable=True)  # Task execution results
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="scheduled_tasks")
    
    def __repr__(self) -> str:
        return f"<ScheduledTask(id={self.id}, name={self.name}, status={self.status}, scheduled_at={self.scheduled_at})>"


class TaskExecutionLog(Base):
    """Task execution log"""
    
    __tablename__ = "task_execution_logs"
    __table_args__ = (
        Index("idx_task_execution_logs_task", "task_id"),
        Index("idx_task_execution_logs_status", "status"),
        Index("idx_task_execution_logs_started_at", "started_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("scheduled_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Execution details
    status = Column(SQLEnum(TaskStatus), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    result_data = Column(JSON, nullable=True)
    
    # Relationships
    task = relationship("ScheduledTask", backref="execution_logs")
    
    def __repr__(self) -> str:
        return f"<TaskExecutionLog(id={self.id}, task_id={self.task_id}, status={self.status}, executed_at={self.started_at})>"

