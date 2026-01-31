"""
Léa AI Conversation Models
SQLAlchemy models for Léa AI assistant conversations
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, JSON, Index, func, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
import uuid

from app.core.database import Base


class LeaConversation(Base):
    """Léa AI conversation model"""
    __tablename__ = "lea_conversations"
    __table_args__ = (
        Index("idx_lea_conversations_user_id", "user_id"),
        Index("idx_lea_conversations_session_id", "session_id"),
        Index("idx_lea_conversations_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    messages = Column(JSON, nullable=False, default=list)  # List of message objects
    context = Column(JSON, nullable=True, default=dict)  # Additional context data
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", backref="lea_conversations")
    tool_usages = relationship("LeaToolUsage", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<LeaConversation(id={self.id}, user_id={self.user_id}, session_id={self.session_id})>"


class LeaToolUsage(Base):
    """Léa AI tool usage tracking"""
    __tablename__ = "lea_tools_usage"
    __table_args__ = (
        Index("idx_lea_tools_usage_conversation_id", "conversation_id"),
        Index("idx_lea_tools_usage_tool_name", "tool_name"),
        Index("idx_lea_tools_usage_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("lea_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False, index=True)
    tool_input = Column(JSON, nullable=True)  # Input parameters
    tool_output = Column(JSON, nullable=True)  # Output result
    execution_time_ms = Column(Integer, nullable=True)  # Execution time in milliseconds
    success = Column(String(20), default='success', nullable=False)  # success, error, timeout
    error_message = Column(Text, nullable=True)  # Error message if failed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    conversation = relationship("LeaConversation", back_populates="tool_usages")

    def __repr__(self) -> str:
        return f"<LeaToolUsage(id={self.id}, conversation_id={self.conversation_id}, tool_name={self.tool_name})>"
