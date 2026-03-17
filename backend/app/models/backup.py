"""
Backup Model
Database and file backups
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BackupType(str, enum.Enum):
    """Backup type"""
    DATABASE = "database"
    FILES = "files"
    FULL = "full"


class BackupStatus(str, enum.Enum):
    """Backup status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


class Backup(Base):
    """Backup model"""
    
    __tablename__ = "backups"
    __table_args__ = (
        Index("idx_backups_type", "backup_type"),
        Index("idx_backups_status", "status"),
        Index("idx_backups_created_at", "created_at"),
        Index("idx_backups_user", "user_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    backup_type = Column(SQLEnum(BackupType), nullable=False, index=True)
    
    # Storage
    file_path = Column(String(500), nullable=True)  # Path to backup file
    file_size = Column(Integer, nullable=True)  # Size in bytes
    checksum = Column(String(64), nullable=True)  # MD5 or SHA256 checksum
    
    # Status
    status = Column(SQLEnum(BackupStatus), default=BackupStatus.PENDING, nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Retention
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    is_automatic = Column(Boolean, default=False, nullable=False)  # Auto-generated backup
    
    # Metadata
    backup_metadata = Column(Text, nullable=True)  # JSON string for additional backup info (renamed from metadata to avoid SQLAlchemy conflict)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="backups")
    
    def __repr__(self) -> str:
        return f"<Backup(id={self.id}, name={self.name}, type={self.backup_type}, status={self.status})>"


class RestoreOperation(Base):
    """Restore operation log"""
    
    __tablename__ = "restore_operations"
    __table_args__ = (
        Index("idx_restore_operations_backup", "backup_id"),
        Index("idx_restore_operations_status", "status"),
        Index("idx_restore_operations_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    backup_id = Column(Integer, ForeignKey("backups.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(BackupStatus), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    backup = relationship("Backup", backref="restore_operations")
    user = relationship("User", backref="restore_operations")
    
    def __repr__(self) -> str:
        return f"<RestoreOperation(id={self.id}, backup_id={self.backup_id}, status={self.status})>"

