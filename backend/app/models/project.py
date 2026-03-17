"""
Project Model
SQLAlchemy model for projects
"""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, func, Index, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectStatus(PyEnum):
    """Project status enum"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class Project(Base):
    """Project model"""
    __tablename__ = "projects"
    __table_args__ = (
        Index("idx_projects_user_id", "user_id"),  # For filtering by user
        Index("idx_projects_status", "status"),  # For filtering by status
        Index("idx_projects_created_at", "created_at"),  # For sorting by creation date
        Index("idx_projects_updated_at", "updated_at"),  # For sorting by update date
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", backref="projects")

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name}, status={self.status})>"


