"""
Menu Model
Navigation menus
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Menu(Base):
    """Navigation menu"""
    
    __tablename__ = "menus"
    __table_args__ = (
        Index("idx_menus_name", "name"),
        Index("idx_menus_location", "location"),
        Index("idx_menus_user_id", "user_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    location = Column(String(50), nullable=False, index=True)  # header, footer, sidebar
    items = Column(JSON, nullable=False)  # Menu items array
    
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
    user = relationship("User", backref="menus")
    
    def __repr__(self) -> str:
        return f"<Menu(id={self.id}, name={self.name}, location={self.location})>"


