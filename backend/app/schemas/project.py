"""
Project Schemas
Pydantic v2 models for project management
"""

from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict, field_validator


class ProjectStatus(str, Enum):
    """Project status enum"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"


class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Project name", strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=5000, description="Project description")
    status: ProjectStatus = Field(default=ProjectStatus.ACTIVE, description="Project status")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate project name"""
        if not v or not v.strip():
            raise ValueError('Project name cannot be empty')
        # Remove extra whitespace
        return v.strip()
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate project description"""
        if v is not None:
            # Remove extra whitespace
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Project description cannot exceed 5000 characters')
            return cleaned
        return v


class ProjectCreate(ProjectBase):
    """Project creation schema"""
    pass


class ProjectUpdate(BaseModel):
    """Project update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Project name", strip_whitespace=True)
    description: Optional[str] = Field(None, max_length=5000, description="Project description")
    status: Optional[ProjectStatus] = Field(None, description="Project status")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate project name"""
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError('Project name cannot be empty')
            return cleaned
        return v
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Validate project description"""
        if v is not None:
            cleaned = v.strip() if v.strip() else None
            if cleaned and len(cleaned) > 5000:
                raise ValueError('Project description cannot exceed 5000 characters')
            return cleaned
        return v


class Project(ProjectBase):
    """Project response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectInDB(Project):
    """Project in database schema"""
    pass

