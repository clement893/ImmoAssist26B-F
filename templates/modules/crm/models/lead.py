"""
CRM Lead Model
Modèle pour les prospects/leads
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class LeadStatus(str, enum.Enum):
    """Statuts possibles d'un lead"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"


class Lead(Base):
    """Modèle Lead pour CRM"""
    __tablename__ = "leads"

    id: UUID = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    first_name: str = Column(String(100), nullable=False)
    last_name: str = Column(String(100), nullable=False)
    email: str = Column(String(255), nullable=False, index=True)
    phone: Optional[str] = Column(String(20), nullable=True)
    company: Optional[str] = Column(String(255), nullable=True)
    job_title: Optional[str] = Column(String(100), nullable=True)
    status: LeadStatus = Column(SQLEnum(LeadStatus), default=LeadStatus.NEW, nullable=False)
    source: Optional[str] = Column(String(100), nullable=True)  # web, referral, etc.
    notes: Optional[str] = Column(Text, nullable=True)
    
    # Relations
    assigned_to_id: Optional[UUID] = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # assigned_to = relationship("User", back_populates="leads")
    
    # Timestamps
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Lead {self.email}>"

