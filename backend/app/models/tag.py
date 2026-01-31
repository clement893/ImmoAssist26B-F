"""
Tag Model
Polymorphic tagging system - tags can be applied to any entity
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index, func, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Tag(Base):
    """Tag model for polymorphic tagging"""
    
    __tablename__ = "tags"
    __table_args__ = (
        Index("idx_tags_name", "name"),
        Index("idx_tags_entity_type", "entity_type"),
        Index("idx_tags_entity_id", "entity_id"),
        Index("idx_tags_user_id", "user_id"),
        Index("idx_tags_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(100), nullable=False, index=True)  # URL-friendly version
    color = Column(String(7), nullable=True)  # Hex color code
    description = Column(Text, nullable=True)
    
    # Polymorphic relationship - tag can belong to any entity
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'project', 'user', 'file'
    entity_id = Column(Integer, nullable=False, index=True)  # ID of the tagged entity
    
    # User who created the tag
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage count (for popularity)
    usage_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="tags")
    
    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name={self.name}, entity_type={self.entity_type}, entity_id={self.entity_id})>"


class Category(Base):
    """Category model for hierarchical categorization"""
    
    __tablename__ = "categories"
    __table_args__ = (
        Index("idx_categories_name", "name"),
        Index("idx_categories_slug", "slug"),
        Index("idx_categories_parent_id", "parent_id"),
        Index("idx_categories_entity_type", "entity_type"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # Icon identifier
    color = Column(String(7), nullable=True)  # Hex color code
    
    # Hierarchical structure
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Entity type this category applies to
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'project', 'file'
    
    # Ordering within parent
    sort_order = Column(Integer, default=0, nullable=False)
    
    # User who created the category
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Self-referential relationship for hierarchy
    parent = relationship("Category", remote_side=[id], backref="children")
    user = relationship("User", backref="categories")
    
    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name}, parent_id={self.parent_id})>"


class EntityTag(Base):
    """Join table for many-to-many relationship between entities and tags"""
    
    __tablename__ = "entity_tags"
    __table_args__ = (
        Index("idx_entity_tags_entity", "entity_type", "entity_id"),
        Index("idx_entity_tags_tag", "tag_id"),
        Index("idx_entity_tags_unique", "entity_type", "entity_id", "tag_id", unique=True),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    tag = relationship("Tag", backref="entity_tags")
    user = relationship("User", backref="entity_tags")
    
    def __repr__(self) -> str:
        return f"<EntityTag(entity_type={self.entity_type}, entity_id={self.entity_id}, tag_id={self.tag_id})>"




