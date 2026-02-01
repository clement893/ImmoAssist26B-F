"""
Property Listing Model
Propriétés importées depuis des sites tiers (ex: Centris) via l'extension Chrome
"""

from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class PropertyListing(Base):
    """Propriété importée depuis un site tiers (Centris, etc.)"""

    __tablename__ = "property_listings"
    __table_args__ = (
        Index("idx_property_listings_broker_id", "broker_id"),
        Index("idx_property_listings_transaction_id", "transaction_id"),
        Index("idx_property_listings_source_url", "source_url"),
    )

    id = Column(Integer, primary_key=True, index=True)
    source_url = Column(String(2048), nullable=False, unique=True)
    source_name = Column(String(255), nullable=False)  # ex: "Centris"
    data = Column(JSON, nullable=False)  # Données extraites (adresse, prix, etc.)
    broker_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_id = Column(
        Integer,
        ForeignKey("real_estate_transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    broker = relationship("User", backref="property_listings")
    transaction = relationship("RealEstateTransaction", backref="property_listings")

    def __repr__(self) -> str:
        return f"<PropertyListing(id={self.id}, source={self.source_name}, broker_id={self.broker_id})>"
