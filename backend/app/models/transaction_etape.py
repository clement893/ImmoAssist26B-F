"""
Transaction Etape Model (Portail client ImmoAssist)
SQLAlchemy model for steps/milestones in a portal transaction
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TransactionEtape(Base):
    """Step/milestone in a portail transaction"""
    __tablename__ = "transaction_etapes"
    __table_args__ = (
        Index("idx_transaction_etapes_transaction_id", "transaction_id"),
        Index("idx_transaction_etapes_ordre", "ordre"),
    )

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("portail_transactions.id"), nullable=False, index=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    ordre = Column(Integer, nullable=False)
    statut = Column(String(50), default="a_planifier", nullable=False)
    # a_planifier, planifie, en_cours, complete
    date_planifiee = Column(DateTime(timezone=True), nullable=True)
    heure_planifiee = Column(String(20), nullable=True)
    date_completion = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    transaction = relationship("PortailTransaction", back_populates="etapes")

    def __repr__(self) -> str:
        return f"<TransactionEtape(id={self.id}, titre={self.titre})>"
