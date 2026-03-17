"""
Documentation Model
Help articles and documentation
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class DocumentationArticle(Base):
    """Documentation article"""
    
    __tablename__ = "documentation_articles"
    __table_args__ = (
        Index("idx_doc_articles_slug", "slug", unique=True),
        Index("idx_doc_articles_category", "category_id"),
        Index("idx_doc_articles_published", "is_published"),
        Index("idx_doc_articles_featured", "is_featured"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)  # Markdown or HTML content
    excerpt = Column(Text, nullable=True)  # Short description
    
    # Categorization
    category_id = Column(Integer, ForeignKey("documentation_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    tags = Column(Text, nullable=True)  # JSON array of tags
    
    # Status
    is_published = Column(Boolean, default=False, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    
    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    
    # Analytics
    view_count = Column(Integer, default=0, nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)
    not_helpful_count = Column(Integer, default=0, nullable=False)
    
    # Metadata
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    category = relationship("DocumentationCategory", backref="articles")
    author = relationship("User", backref="documentation_articles")
    
    def __repr__(self) -> str:
        return f"<DocumentationArticle(id={self.id}, slug={self.slug}, title={self.title})>"


class DocumentationCategory(Base):
    """Documentation category"""
    
    __tablename__ = "documentation_categories"
    __table_args__ = (
        Index("idx_doc_categories_slug", "slug", unique=True),
        Index("idx_doc_categories_parent", "parent_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("documentation_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    order = Column(Integer, default=0, nullable=False)
    icon = Column(String(50), nullable=True)  # Icon name or emoji
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    parent = relationship("DocumentationCategory", remote_side=[id], backref="children")
    
    def __repr__(self) -> str:
        return f"<DocumentationCategory(id={self.id}, slug={self.slug}, name={self.name})>"


class DocumentationFeedback(Base):
    """User feedback on documentation articles"""
    
    __tablename__ = "documentation_feedback"
    __table_args__ = (
        Index("idx_doc_feedback_article", "article_id"),
        Index("idx_doc_feedback_user", "user_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("documentation_articles.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Feedback
    is_helpful = Column(Boolean, nullable=False)  # True = helpful, False = not helpful
    comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    article = relationship("DocumentationArticle", backref="feedback")
    user = relationship("User", backref="documentation_feedback")
    
    def __repr__(self) -> str:
        return f"<DocumentationFeedback(id={self.id}, article_id={self.article_id}, is_helpful={self.is_helpful})>"

