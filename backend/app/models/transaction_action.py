"""
Transaction Action Models
Modèles pour la gestion des actions de transaction immobilière
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class TransactionAction(Base):
    """Définition des actions possibles pour les transactions"""
    __tablename__ = "transaction_actions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True, comment="Code unique de l'action")
    name = Column(String(200), nullable=False, comment="Nom de l'action")
    description = Column(Text, nullable=True, comment="Description détaillée")
    
    # Transitions de statut
    from_status = Column(String(50), nullable=False, comment="Statut de départ (ou '*' pour tous)")
    to_status = Column(String(50), nullable=False, comment="Statut d'arrivée")
    
    # Prérequis
    required_documents = Column(JSON, nullable=True, default=list, comment="Documents requis")
    required_fields = Column(JSON, nullable=True, default=list, comment="Champs obligatoires")
    required_roles = Column(JSON, nullable=True, default=list, comment="Rôles autorisés")
    
    # Configuration
    creates_deadline = Column(Boolean, default=False, comment="Crée un délai automatiquement")
    deadline_days = Column(Integer, nullable=True, comment="Nombre de jours pour le délai")
    deadline_type = Column(String(50), nullable=True, comment="Type de délai créé")
    
    generates_document = Column(Boolean, default=False, comment="Génère un document")
    document_template = Column(String(100), nullable=True, comment="Template de document")
    
    sends_notification = Column(Boolean, default=True, comment="Envoie une notification")
    notification_recipients = Column(JSON, nullable=True, default=list, comment="Destinataires")
    
    # Métadonnées
    order_index = Column(Integer, default=0, comment="Ordre d'affichage")
    is_active = Column(Boolean, default=True, comment="Action active")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relations
    completions = relationship("ActionCompletion", back_populates="action", lazy="select")

    def __repr__(self):
        return f"<TransactionAction(code={self.code}, name={self.name})>"


class ActionCompletion(Base):
    """Historique des actions effectuées"""
    __tablename__ = "action_completions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    action_code = Column(String(50), ForeignKey("transaction_actions.code"), nullable=False, index=True)
    
    # Qui et quand
    completed_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Données associées
    data = Column(JSON, nullable=True, default=dict, comment="Données spécifiques à l'action")
    notes = Column(Text, nullable=True, comment="Notes de l'utilisateur")
    
    # Résultat
    previous_status = Column(String(50), nullable=False, comment="Statut avant l'action")
    new_status = Column(String(50), nullable=False, comment="Statut après l'action")
    
    # Traçabilité
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relations
    transaction = relationship("RealEstateTransaction", backref="action_completions_rel", lazy="select")
    action = relationship("TransactionAction", back_populates="completions", lazy="select")
    user = relationship("User", lazy="select")

    def __repr__(self):
        return f"<ActionCompletion(id={self.id}, action_code={self.action_code}, transaction_id={self.transaction_id})>"
