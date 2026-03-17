"""
Webhook Event Model
SQLAlchemy model for tracking processed webhook events (idempotency)
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, Index, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class WebhookEvent(Base):
    """Webhook event model for idempotency"""
    __tablename__ = "webhook_events"
    __table_args__ = (
        Index("idx_webhook_events_stripe_id", "stripe_event_id", unique=True),
        Index("idx_webhook_events_type", "event_type"),
        Index("idx_webhook_events_processed_at", "processed_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    stripe_event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Store event data for debugging/auditing (optional, can be large)
    event_data = Column(Text, nullable=True)  # JSON string
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<WebhookEvent(id={self.id}, stripe_event_id={self.stripe_event_id}, event_type={self.event_type})>"

