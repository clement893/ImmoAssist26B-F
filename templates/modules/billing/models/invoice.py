"""
Billing Invoice Model
Modèle pour les factures
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class InvoiceStatus(str, enum.Enum):
    """Statuts possibles d'une facture"""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Invoice(Base):
    """Modèle Invoice pour facturation"""
    __tablename__ = "invoices"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    invoice_number: str = Column(String(50), unique=True, nullable=False, index=True)
    client_name: str = Column(String(255), nullable=False)
    client_email: str = Column(String(255), nullable=False)
    client_address: Optional[str] = Column(Text, nullable=True)
    
    # Montants
    subtotal: Decimal = Column(Numeric(10, 2), nullable=False, default=0)
    tax_rate: Decimal = Column(Numeric(5, 2), nullable=False, default=0)  # Pourcentage
    tax_amount: Decimal = Column(Numeric(10, 2), nullable=False, default=0)
    total: Decimal = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Dates
    issue_date: datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    due_date: datetime = Column(DateTime, nullable=False)
    paid_date: Optional[datetime] = Column(DateTime, nullable=True)
    
    status: InvoiceStatus = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    notes: Optional[str] = Column(Text, nullable=True)
    
    # Relations
    created_by_id: UUID = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # created_by = relationship("User", back_populates="invoices")
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Invoice {self.invoice_number}>"

