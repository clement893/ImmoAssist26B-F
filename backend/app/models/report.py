"""
Report Model
Dashboard reports storage
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Report(Base):
    """Report model for dashboard reports"""
    
    __tablename__ = "reports"
    __table_args__ = (
        Index("idx_reports_name", "name"),
        Index("idx_reports_user_id", "user_id"),
        Index("idx_reports_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Report configuration (stored as JSON)
    config = Column(JSON, nullable=False)  # ReportConfig structure
    data = Column(JSON, nullable=True)  # Generated report data
    
    # Ownership
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Metadata
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    
    # Relationships
    user = relationship("User", backref="reports")
    
    def __repr__(self) -> str:
        return f"<Report(id={self.id}, name={self.name}, user_id={self.user_id})>"
