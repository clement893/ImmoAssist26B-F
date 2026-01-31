"""
Email Template Model
Email templates for notifications and communications
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class EmailTemplate(Base):
    """Email template model"""
    
    __tablename__ = "email_templates"
    __table_args__ = (
        Index("idx_email_templates_key", "key", unique=True),
        Index("idx_email_templates_active", "is_active"),
        Index("idx_email_templates_category", "category"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True, index=True)  # e.g., 'welcome_email', 'password_reset'
    name = Column(String(200), nullable=False)  # Human-readable name
    category = Column(String(50), nullable=True, index=True)  # 'notification', 'marketing', 'system'
    
    # Template content
    subject = Column(String(200), nullable=False)
    html_body = Column(Text, nullable=False)
    text_body = Column(Text, nullable=True)  # Plain text version
    
    # Template variables
    variables = Column(Text, nullable=True)  # JSON array of variable names
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_system = Column(Boolean, default=False, nullable=False)  # System templates cannot be deleted
    
    # Localization
    language = Column(String(10), default='en', nullable=False)  # 'en', 'fr', etc.
    
    # Metadata
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    created_by = relationship("User", backref="email_templates")
    
    def __repr__(self) -> str:
        return f"<EmailTemplate(id={self.id}, key={self.key}, name={self.name})>"


class EmailTemplateVersion(Base):
    """Email template version history"""
    
    __tablename__ = "email_template_versions"
    __table_args__ = (
        Index("idx_email_template_versions_template", "template_id"),
        Index("idx_email_template_versions_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("email_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Version content
    subject = Column(String(200), nullable=False)
    html_body = Column(Text, nullable=False)
    text_body = Column(Text, nullable=True)
    
    # Metadata
    version_number = Column(Integer, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    template = relationship("EmailTemplate", backref="versions")
    created_by = relationship("User", backref="email_template_versions")
    
    def __repr__(self) -> str:
        return f"<EmailTemplateVersion(id={self.id}, template_id={self.template_id}, version_number={self.version_number})>"




