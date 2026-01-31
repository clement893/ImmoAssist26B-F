"""
Comment Model
Polymorphic commenting system - comments can be added to any entity
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Comment(Base):
    """Comment model for polymorphic commenting"""
    
    __tablename__ = "comments"
    __table_args__ = (
        Index("idx_comments_entity", "entity_type", "entity_id"),
        Index("idx_comments_user_id", "user_id"),
        Index("idx_comments_parent_id", "parent_id"),
        Index("idx_comments_created_at", "created_at"),
        Index("idx_comments_is_deleted", "is_deleted"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Polymorphic relationship - comment can belong to any entity
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'project', 'file', 'user'
    entity_id = Column(Integer, nullable=False, index=True)  # ID of the commented entity
    
    # Threading support
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Comment content
    content = Column(Text, nullable=False)
    content_html = Column(Text, nullable=True)  # Rendered HTML version
    
    # User who created the comment
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    is_edited = Column(Boolean, default=False, nullable=False)
    
    # Reactions count (denormalized for performance)
    reactions_count = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    
    def __repr__(self) -> str:
        return f"<Comment(id={self.id}, entity_type={self.entity_type}, entity_id={self.entity_id}, user_id={self.user_id})>"


class CommentReaction(Base):
    """Comment reactions (likes, emojis, etc.)"""
    
    __tablename__ = "comment_reactions"
    __table_args__ = (
        Index("idx_comment_reactions_comment", "comment_id"),
        Index("idx_comment_reactions_user", "user_id"),
        Index("idx_comment_reactions_unique", "comment_id", "user_id", "reaction_type", unique=True),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reaction_type = Column(String(20), nullable=False)  # 'like', 'love', 'thumbs_up', 'thumbs_down', etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    comment = relationship("Comment", backref="reactions")
    user = relationship("User", backref="comment_reactions")
    
    def __repr__(self) -> str:
        return f"<CommentReaction(id={self.id}, comment_id={self.comment_id}, user_id={self.user_id}, reaction_type={self.reaction_type})>"




