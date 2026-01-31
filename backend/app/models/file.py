"""File model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Integer, Index, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class File(Base):
    """File model."""

    __tablename__ = "files"
    __table_args__ = (
        Index("idx_files_user_id", "user_id"),
        Index("idx_files_created_at", "created_at"),
        Index("idx_files_file_key", "file_key", unique=True),
    )

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_key = Column(String(500), nullable=False, unique=True)  # Storage path (S3 key or local path)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)  # File size in bytes
    url = Column(String(1000), nullable=False)
    folder = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="files")

    def __repr__(self) -> str:
        return f"<File(id={self.id}, filename={self.filename}, user_id={self.user_id})>"

