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
        Index("idx_forms_code", "code"),
        Index("idx_forms_category", "category"),
        Index("idx_forms_transaction_id", "transaction_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    fields = Column(JSON, nullable=False)  # Form field configurations
    
    # Form settings
    submit_button_text = Column(String(50), default='Submit', nullable=False)
    success_message = Column(Text, nullable=True)
    
    # OACIQ-specific fields
    code = Column(String(20), unique=True, nullable=True, index=True)  # OACIQ form code (e.g., "PA", "CCVE")
    category = Column(String(50), nullable=True, index=True)  # "obligatoire", "recommandé", "curateur_public"
    pdf_url = Column(Text, nullable=True)  # URL to official OACIQ PDF
    extraction_schema = Column(JSON, nullable=True)  # Schema for LLM extraction: {"fields": [{"name", "description"}]}
    compliance_rules = Column(JSON, nullable=True)  # OACIQ compliance rules: {"rules": [{"code", "description", "field", "type", "params", "severity", "message"}]}
    
    # Ownership and relationships
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    
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
    transaction = relationship("RealEstateTransaction", backref="forms")
    submissions = relationship("FormSubmission", back_populates="form", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Form(id={self.id}, name={self.name}, code={self.code})>"


class FormSubmission(Base):
    """Form submission data"""
    
    __tablename__ = "form_submissions"
    __table_args__ = (
        Index("idx_form_submissions_form_id", "form_id"),
        Index("idx_form_submissions_submitted_at", "submitted_at"),
        Index("idx_form_submissions_status", "status"),
        Index("idx_form_submissions_transaction_id", "transaction_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(JSON, nullable=False)  # Submission data
    
    # Status for OACIQ forms
    status = Column(String(20), default='draft', nullable=False, index=True)  # 'draft', 'completed', 'signed'
    
    # Metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(String(500), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # OCR extraction metadata
    source_document_url = Column(String(512), nullable=True)  # URL to original PDF/image (S3)
    extraction_confidence = Column(JSON, nullable=True)  # Per-field confidence e.g. {"buyer_name": 0.95}
    needs_review = Column(Boolean, default=True, nullable=False)  # Manual review required
    
    # Relationships
    form = relationship("Form", back_populates="submissions")
    user = relationship("User", backref="form_submissions")
    transaction = relationship("RealEstateTransaction", backref="form_submissions")
    versions = relationship("FormSubmissionVersion", back_populates="submission", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<FormSubmission(id={self.id}, form_id={self.form_id}, status={self.status}, submitted_at={self.submitted_at})>"


class FormSubmissionVersion(Base):
    """Version history for form submissions"""
    
    __tablename__ = "form_submission_versions"
    __table_args__ = (
        Index("idx_form_submission_versions_submission_id", "submission_id"),
        Index("idx_form_submission_versions_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("form_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(JSON, nullable=False)  # Snapshot of submission data
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    submission = relationship("FormSubmission", back_populates="versions")
    
    def __repr__(self) -> str:
        return f"<FormSubmissionVersion(id={self.id}, submission_id={self.submission_id}, created_at={self.created_at})>"


