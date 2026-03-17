"""
Transaction Tache Model (Portail client ImmoAssist)
SQLAlchemy model for tasks in a portal transaction
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TransactionTache(Base):
    """Task in a portail transaction"""
    __tablename__ = "transaction_taches"
    __table_args__ = (
        Index("idx_transaction_taches_transaction_id", "transaction_id"),
        Index("idx_transaction_taches_cree_par_id", "cree_par_id"),
        Index("idx_transaction_taches_completee", "completee"),
    )

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("portail_transactions.id"), nullable=False, index=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priorite = Column(String(50), nullable=False)  # 'haute', 'moyenne', 'basse'
    categorie = Column(String(100), nullable=False)
    echeance = Column(DateTime(timezone=True), nullable=False)
    completee = Column(Boolean, default=False, nullable=False)
    date_completion = Column(DateTime(timezone=True), nullable=True)
    cree_par_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date_creation = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    transaction = relationship("PortailTransaction", back_populates="taches")
    cree_par = relationship("User", back_populates="taches_portail_creees", foreign_keys=[cree_par_id])

    def __repr__(self) -> str:
        return f"<TransactionTache(id={self.id}, titre={self.titre})>"
