"""SQLAlchemy models for Léa API."""

from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.database import Base


class User(Base):
    """Demo user for standalone API (minimal)."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    full_name = Column(String(255), default="Courtier Demo")
    permis_number = Column(String(50), nullable=True)


class Transaction(Base):
    """Transaction immobilière (5 champs requis)."""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    conversation_id = Column(String(255), nullable=True)

    property_address = Column(String(500), nullable=True)
    sellers = Column(JSON, default=list)  # ["Tremblay", "Gagnon"]
    buyers = Column(JSON, default=list)  # ["Martin", "Côté"]
    offered_price = Column(Float, nullable=True)
    transaction_type = Column(String(20), nullable=True)  # vente | achat

    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PromesseAchat(Base):
    """Promesse d'Achat (PA)."""

    __tablename__ = "promesses_achat"

    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)

    # Préremplis depuis transaction
    acheteurs = Column(JSON, default=list)
    vendeurs = Column(JSON, default=list)
    property_address = Column(String(500), nullable=True)
    prix_offert = Column(Float, nullable=True)
    prix_achat = Column(Float, nullable=True)

    # Champs dérivés
    property_city = Column(String(100), nullable=True)
    property_postal_code = Column(String(20), nullable=True)
    property_province = Column(String(50), default="Québec")
    courtier_vendeur_nom = Column(String(255), nullable=True)
    courtier_vendeur_permis = Column(String(50), nullable=True)
    courtier_acheteur_nom = Column(String(255), nullable=True)
    courtier_acheteur_permis = Column(String(50), nullable=True)

    # Champs utilisateur
    acheteur_adresse = Column(String(500), nullable=True)
    acheteur_telephone = Column(String(50), nullable=True)
    acheteur_courriel = Column(String(255), nullable=True)
    vendeur_adresse = Column(String(500), nullable=True)
    vendeur_telephone = Column(String(50), nullable=True)
    vendeur_courriel = Column(String(255), nullable=True)
    description_immeuble = Column(Text, nullable=True)
    acompte = Column(Float, nullable=True)
    date_acompte = Column(Date, nullable=True)
    delai_remise_depot = Column(String(100), nullable=True)
    mode_paiement = Column(String(100), nullable=True)
    montant_hypotheque = Column(Float, nullable=True)
    delai_financement = Column(String(100), nullable=True)
    date_acte_vente = Column(Date, nullable=True)
    condition_inspection = Column(Boolean, nullable=True)
    date_limite_inspection = Column(Date, nullable=True)
    condition_documents = Column(Boolean, nullable=True)
    inclusions = Column(JSON, default=list)
    exclusions = Column(JSON, default=list)
    autres_conditions = Column(Text, nullable=True)
    delai_acceptation = Column(String(100), nullable=True)  # Date ISO ou durée ("24 heures")

    status = Column(String(20), default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeaConversation(Base):
    """Session de conversation Léa."""

    __tablename__ = "lea_conversations"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)

    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    promesse_achat_id = Column(Integer, ForeignKey("promesses_achat.id"), nullable=True)

    messages = Column(JSON, default=list)
    context = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
