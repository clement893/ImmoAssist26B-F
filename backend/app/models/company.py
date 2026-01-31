"""
Company Model
SQLAlchemy model for commercial companies
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Boolean, ForeignKey, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Company(Base):
    """Company model for commercial module"""
    __tablename__ = "companies"
    __table_args__ = (
        Index("idx_companies_name", "name"),
        Index("idx_companies_created_at", "created_at"),
        Index("idx_companies_is_client", "is_client"),
        Index("idx_companies_parent_company_id", "parent_company_id"),
        Index("idx_companies_country", "country"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    parent_company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    description = Column(String(1000), nullable=True)
    website = Column(String(500), nullable=True)
    logo_url = Column(String(1000), nullable=True)  # S3 URL
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True, index=True)
    is_client = Column(Boolean, default=False, nullable=False, index=True)
    facebook = Column(String(500), nullable=True)
    instagram = Column(String(500), nullable=True)
    linkedin = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    parent_company = relationship("Company", remote_side=[id], backref="subsidiaries", lazy="select")
    contacts = relationship("Contact", back_populates="company", lazy="select")

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name={self.name})>"
