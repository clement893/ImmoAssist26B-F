"""
Transaction Message Model (Portail client ImmoAssist)
SQLAlchemy model for messages in a portal transaction
"""

from sqlalchemy import Column, Integer, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TransactionMessage(Base):
    """Message in a portail transaction (client <-> broker)"""
    __tablename__ = "transaction_messages"
    __table_args__ = (
        Index("idx_transaction_messages_transaction_id", "transaction_id"),
        Index("idx_transaction_messages_expediteur_id", "expediteur_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("portail_transactions.id"), nullable=False, index=True)
    expediteur_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)
    date_envoi = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    lu = Column(Boolean, default=False, nullable=False)

    # Relationships
    transaction = relationship("PortailTransaction", back_populates="messages")
    expediteur = relationship("User", back_populates="messages_portail", foreign_keys=[expediteur_id])

    def __repr__(self) -> str:
        return f"<TransactionMessage(id={self.id})>"
