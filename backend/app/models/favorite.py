"""
Favorite/Bookmark Model
Polymorphic favorites system - users can favorite any entity
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Favorite(Base):
    """Favorite/Bookmark model for polymorphic favoriting"""
    
    __tablename__ = "favorites"
    __table_args__ = (
        Index("idx_favorites_user_entity", "user_id", "entity_type", "entity_id"),
        Index("idx_favorites_entity", "entity_type", "entity_id"),
        Index("idx_favorites_created_at", "created_at"),
        Index("idx_favorites_unique", "user_id", "entity_type", "entity_id", unique=True),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User who favorited
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Polymorphic relationship - favorite can belong to any entity
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'project', 'file', 'user'
    entity_id = Column(Integer, nullable=False, index=True)  # ID of the favorited entity
    
    # Optional metadata
    notes = Column(String(500), nullable=True)  # User notes about the favorite
    tags = Column(String(200), nullable=True)  # Comma-separated tags for organization
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="favorites")
    
    def __repr__(self) -> str:
        return f"<Favorite(id={self.id}, user_id={self.user_id}, entity_type={self.entity_type}, entity_id={self.entity_id})>"




