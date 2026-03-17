"""
Page Model
CMS pages with sections
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Page(Base):
    """CMS Page model"""
    
    __tablename__ = "pages"
    __table_args__ = (
        Index("idx_pages_slug", "slug", unique=True),
        Index("idx_pages_status", "status"),
        Index("idx_pages_user_id", "user_id"),
        Index("idx_pages_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    content = Column(Text, nullable=True)  # Legacy content
    content_html = Column(Text, nullable=True)  # Rendered HTML
    sections = Column(JSON, nullable=True)  # Page builder sections
    
    # Status
    status = Column(String(20), default='draft', nullable=False, index=True)  # draft, published, archived
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(String(500), nullable=True)
    
    # Ownership
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="pages")
    
    def __repr__(self) -> str:
        return f"<Page(id={self.id}, title={self.title}, slug={self.slug}, status={self.status})>"


