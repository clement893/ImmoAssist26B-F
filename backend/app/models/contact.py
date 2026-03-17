"""
Contact Model
SQLAlchemy model for commercial contacts
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Date
from sqlalchemy.orm import relationship

from app.core.database import Base


class Contact(Base):
    """Contact model for commercial module"""
    __tablename__ = "contacts"
    __table_args__ = (
        Index("idx_contacts_company_id", "company_id"),
        Index("idx_contacts_employee_id", "employee_id"),
        Index("idx_contacts_circle", "circle"),
        Index("idx_contacts_email", "email"),
        Index("idx_contacts_created_at", "created_at"),
        Index("idx_contacts_updated_at", "updated_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    position = Column(String(200), nullable=True)
    circle = Column(String(50), nullable=True, index=True)  # client, prospect, partenaire, fournisseur, autre
    linkedin = Column(String(500), nullable=True)
    photo_url = Column(String(1000), nullable=True)  # S3 URL
    photo_filename = Column(String(500), nullable=True)  # Filename for photo matching during import
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    birthday = Column(Date, nullable=True)
    language = Column(String(10), nullable=True)  # fr, en, es, etc.
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    company = relationship("Company", back_populates="contacts", lazy="select")
    employee = relationship("User", foreign_keys=[employee_id], backref="assigned_contacts", lazy="select")

    def __repr__(self) -> str:
        return f"<Contact(id={self.id}, name={self.first_name} {self.last_name})>"
