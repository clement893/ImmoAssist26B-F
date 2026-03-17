"""
Version History Model
Track revisions and version history for entities
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, JSON, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Version(Base):
    """Version history model for tracking entity revisions"""
    
    __tablename__ = "versions"
    __table_args__ = (
        Index("idx_versions_entity", "entity_type", "entity_id"),
        Index("idx_versions_user_id", "user_id"),
        Index("idx_versions_version_number", "entity_type", "entity_id", "version_number"),
        Index("idx_versions_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Polymorphic relationship - version can belong to any entity
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'project', 'document', 'file'
    entity_id = Column(Integer, nullable=False, index=True)  # ID of the versioned entity
    
    # Version details
    version_number = Column(Integer, nullable=False)  # Sequential version number (1, 2, 3, ...)
    title = Column(String(200), nullable=True)  # Version title/name
    description = Column(Text, nullable=True)  # What changed in this version
    
    # Content snapshot
    content_snapshot = Column(JSON, nullable=True)  # Full snapshot of entity data at this version
    content_diff = Column(JSON, nullable=True)  # Diff from previous version
    
    # User who created this version
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Metadata
    change_type = Column(String(20), nullable=True)  # 'create', 'update', 'delete', 'restore'
    is_current = Column(Boolean, default=False, nullable=False)  # Is this the current version?
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", backref="versions")
    
    def __repr__(self) -> str:
        return f"<Version(id={self.id}, entity_type={self.entity_type}, entity_id={self.entity_id}, version_number={self.version_number})>"

