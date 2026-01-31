"""
Template Model
Reusable templates/boilerplates system
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Template(Base):
    """Template model for reusable templates/boilerplates"""
    
    __tablename__ = "templates"
    __table_args__ = (
        Index("idx_templates_name", "name"),
        Index("idx_templates_category", "category"),
        Index("idx_templates_user_id", "user_id"),
        Index("idx_templates_is_public", "is_public"),
        Index("idx_templates_entity_type", "entity_type"),
        Index("idx_templates_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True, index=True)  # e.g., 'email', 'document', 'project'
    
    # Template content
    content = Column(Text, nullable=False)  # Template body/content
    content_html = Column(Text, nullable=True)  # Rendered HTML version
    variables = Column(JSON, nullable=True)  # Available variables for substitution
    
    # Entity type this template applies to
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., 'email', 'project', 'document'
    
    # Ownership and sharing
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_public = Column(Boolean, default=False, nullable=False, index=True)  # Can others use this template?
    is_system = Column(Boolean, default=False, nullable=False)  # System template (cannot be deleted)
    
    # Usage stats
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Preview/thumbnail
    preview_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="templates")
    
    def __repr__(self) -> str:
        return f"<Template(id={self.id}, name={self.name}, category={self.category}, entity_type={self.entity_type})>"


class TemplateVariable(Base):
    """Template variable definitions"""
    
    __tablename__ = "template_variables"
    __table_args__ = (
        Index("idx_template_variables_template", "template_id"),
        Index("idx_template_variables_name", "name"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Variable name (e.g., 'user_name', 'project_title')
    label = Column(String(200), nullable=True)  # Human-readable label
    type = Column(String(20), default='string', nullable=False)  # string, number, date, boolean
    default_value = Column(Text, nullable=True)  # Default value
    required = Column(Boolean, default=False, nullable=False)
    description = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    template = relationship("Template", backref="template_variables")
    
    def __repr__(self) -> str:
        return f"<TemplateVariable(id={self.id}, template_id={self.template_id}, name={self.name})>"




