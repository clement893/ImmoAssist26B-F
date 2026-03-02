"""
LeaKnowledgeContent model.
Stores editable knowledge base content for Léa (e.g. OACIQ formulaires).
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, func

from app.core.database import Base


class LeaKnowledgeContent(Base):
    """Stores key-value knowledge content for Léa (e.g. key='oaciq' for OACIQ formulaires)."""

    __tablename__ = "lea_knowledge_content"

    key = Column(String(100), primary_key=True)
    content = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<LeaKnowledgeContent(key={self.key!r})>"
