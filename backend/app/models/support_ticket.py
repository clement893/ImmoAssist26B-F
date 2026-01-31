"""
Support Ticket Model
Customer support tickets
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, func, Boolean, JSON
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SupportTicket(Base):
    """Support ticket"""
    
    __tablename__ = "support_tickets"
    __table_args__ = (
        Index("idx_tickets_user_id", "user_id"),
        Index("idx_tickets_status", "status"),
        Index("idx_tickets_priority", "priority"),
        Index("idx_tickets_category", "category"),
        Index("idx_tickets_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # technical, billing, feature, general, bug
    status = Column(String(20), default=TicketStatus.OPEN.value, nullable=False, index=True)
    priority = Column(String(20), default=TicketPriority.MEDIUM.value, nullable=False, index=True)
    
    # Ownership
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_reply_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="support_tickets")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<SupportTicket(id={self.id}, subject={self.subject}, status={self.status})>"


class TicketMessage(Base):
    """Support ticket message"""
    
    __tablename__ = "ticket_messages"
    __table_args__ = (
        Index("idx_ticket_messages_ticket_id", "ticket_id"),
        Index("idx_ticket_messages_user_id", "user_id"),
        Index("idx_ticket_messages_created_at", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    
    # Author
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_staff = Column(Boolean, default=False, nullable=False)  # Staff/admin reply
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    ticket = relationship("SupportTicket", back_populates="messages")
    user = relationship("User", backref="ticket_messages")
    
    def __repr__(self) -> str:
        return f"<TicketMessage(id={self.id}, ticket_id={self.ticket_id}, is_staff={self.is_staff})>"


