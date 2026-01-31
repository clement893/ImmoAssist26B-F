"""
Invoice Model
SQLAlchemy model for invoices
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, Numeric, Text, func, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class InvoiceStatus(str, enum.Enum):
    """Invoice status"""
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    UNCOLLECTIBLE = "uncollectible"


class Invoice(Base):
    """Invoice model"""
    __tablename__ = "invoices"
    __table_args__ = (
        Index("idx_invoices_user_id", "user_id"),
        Index("idx_invoices_subscription_id", "subscription_id"),
        Index("idx_invoices_status", "status"),
        Index("idx_invoices_stripe_id", "stripe_invoice_id"),
        Index("idx_invoices_due_date", "due_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    
    # Stripe integration
    stripe_invoice_id = Column(String(255), unique=True, nullable=True, index=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    
    # Invoice details
    invoice_number = Column(String(100), unique=True, nullable=True)
    amount_due = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), default=0, nullable=False)
    currency = Column(String(3), default="usd", nullable=False)
    
    # Status
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False, index=True)
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # PDF and data
    invoice_pdf_url = Column(String(500), nullable=True)
    hosted_invoice_url = Column(String(500), nullable=True)
    
    # Metadata (renamed from 'metadata' to avoid SQLAlchemy reserved name conflict)
    invoice_metadata = Column("metadata", Text, nullable=True)  # JSON string
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")

    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, user_id={self.user_id}, status={self.status}, amount={self.amount_due})>"

