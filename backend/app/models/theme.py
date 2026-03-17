"""
Theme model for global platform theme management.
Allows superadmin/developers to set a global theme for all users.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Theme(Base):
    """
    Theme model for storing global platform theme configuration.
    Only one active theme can exist at a time (is_active=True).
    """
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Theme configuration stored as JSON
    # Contains CSS variables and theme settings
    config = Column(JSON, nullable=False, default=dict)
    
    # Active status - only one theme can be active at a time
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    
    # Metadata
    created_by = Column(Integer, nullable=True)  # User ID who created the theme
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Theme(id={self.id}, name='{self.name}', is_active={self.is_active})>"


