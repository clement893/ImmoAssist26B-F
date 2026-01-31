"""
Form Model
Dynamic forms and submissions
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Form(Base):
    """Dynamic form definition"""
    
    __tablename__ = "forms"
    __table_args__ = (
        Index("idx_forms_name", "name"),
        Index("idx_forms_user_id", "user_id"),
        Index("idx_forms_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    fields = Column(JSON, nullable=False)  # Form field configurations
    
    # Form settings
    submit_button_text = Column(String(50), default='Submit', nullable=False)
    success_message = Column(Text, nullable=True)
    
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
    
    # Relationships
    user = relationship("User", backref="forms")
    submissions = relationship("FormSubmission", back_populates="form", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Form(id={self.id}, name={self.name})>"


class FormSubmission(Base):
    """Form submission data"""
    
    __tablename__ = "form_submissions"
    __table_args__ = (
        Index("idx_form_submissions_form_id", "form_id"),
        Index("idx_form_submissions_submitted_at", "submitted_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(JSON, nullable=False)  # Submission data
    
    # Metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    form = relationship("Form", back_populates="submissions")
    user = relationship("User", backref="form_submissions")
    
    def __repr__(self) -> str:
        return f"<FormSubmission(id={self.id}, form_id={self.form_id}, submitted_at={self.submitted_at})>"


