"""
Theme Font model for storing custom uploaded fonts.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class ThemeFont(Base):
    """
    Theme Font model for storing custom uploaded fonts.
    Fonts are stored in S3 and metadata is stored in the database.
    """
    __tablename__ = "theme_fonts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)  # Display name (e.g., "Custom Font")
    font_family = Column(String(100), nullable=False, index=True)  # CSS font-family name
    description = Column(Text, nullable=True)
    
    # File storage
    file_key = Column(String(500), nullable=False, unique=True)  # S3 key or storage path
    filename = Column(String(255), nullable=False)  # Original filename
    file_size = Column(Integer, nullable=False)  # File size in bytes
    mime_type = Column(String(100), nullable=False)  # font/woff, font/woff2, font/ttf, font/otf
    url = Column(String(1000), nullable=False)  # Presigned URL or public URL
    
    # Font metadata
    font_format = Column(String(20), nullable=False)  # woff, woff2, ttf, otf
    font_weight = Column(String(50), nullable=True)  # normal, bold, 400, 700, etc.
    font_style = Column(String(50), nullable=True)  # normal, italic, oblique
    
    # Relationships
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<ThemeFont(id={self.id}, name='{self.name}', font_family='{self.font_family}')>"

