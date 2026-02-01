"""
Transaction Document Model (Portail client ImmoAssist)
SQLAlchemy model for documents shared in a portal transaction
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TransactionDocument(Base):
    """Document shared in a portail transaction"""
    __tablename__ = "transaction_documents"
    __table_args__ = (
        Index("idx_transaction_documents_transaction_id", "transaction_id"),
        Index("idx_transaction_documents_partage_par_id", "partage_par_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("portail_transactions.id"), nullable=False, index=True)
    nom = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # 'pdf', 'image', 'excel', 'word'
    categorie = Column(String(100), nullable=False)
    taille = Column(String(50), nullable=True)
    url = Column(String(500), nullable=False)
    partage_par_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date_partage = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    nouveau = Column(Boolean, default=True, nullable=False)

    # Relationships
    transaction = relationship("PortailTransaction", back_populates="documents")
    partage_par = relationship("User", back_populates="documents_partages_portail", foreign_keys=[partage_par_id])

    def __repr__(self) -> str:
        return f"<TransactionDocument(id={self.id}, nom={self.nom})>"
