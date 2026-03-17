"""
Post Model
Blog posts and articles
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Post(Base):
    """Blog Post model"""
    
    __tablename__ = "posts"
    __table_args__ = (
        Index("idx_posts_slug", "slug", unique=True),
        Index("idx_posts_status", "status"),
        Index("idx_posts_author_id", "author_id"),
        Index("idx_posts_category_id", "category_id"),
        Index("idx_posts_published_at", "published_at"),
        Index("idx_posts_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    excerpt = Column(Text, nullable=True)  # Short description/excerpt
    content = Column(Text, nullable=False)  # Full content
    content_html = Column(Text, nullable=True)  # Rendered HTML version
    
    # Status
    status = Column(String(20), default='draft', nullable=False, index=True)  # draft, published, archived
    
    # Author
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Categorization
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    tags = Column(JSON, nullable=True)  # Array of tag strings
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Relationships
    author = relationship("User", backref="posts")
    category = relationship("Category", backref="posts")
    
    def __repr__(self) -> str:
        return f"<Post(id={self.id}, title={self.title}, slug={self.slug}, status={self.status})>"
