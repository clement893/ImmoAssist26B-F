# 📋 Plan d'Implémentation : Système de Gestion des Actions de Transaction

**Projet** : ImmoAssist.ia  
**Module** : Gestion des transitions et actions de transactions immobilières  
**Stack** : Next.js 16 + TypeScript + PostgreSQL + SQLAlchemy + FastAPI  
**Date** : 2025

---

## 🎯 Vue d'ensemble

### Objectif
Créer un système complet de gestion des actions qui font progresser une transaction immobilière à travers ses différents statuts, avec :

- ✅ Suivi automatique des étapes obligatoires
- ✅ Validation des prérequis avant chaque action
- ✅ Historique complet des actions effectuées
- ✅ Notifications automatiques aux parties prenantes
- ✅ Calcul automatique des délais critiques
- ✅ Génération de documents associés

### Flux typique d'une transaction

```
NOUVELLE INSCRIPTION
    ↓ [Action: Publier l'annonce]
PROPRIÉTÉ LISTÉE
    ↓ [Action: Soumettre une offre]
OFFRE SOUMISE
    ↓ [Action: Accepter l'offre]
OFFRE ACCEPTÉE
    ↓ [Action: Compléter l'inspection]
INSPECTION COMPLÉTÉE
    ↓ [Action: Obtenir le financement]
FINANCEMENT APPROUVÉ
    ↓ [Action: Signer chez le notaire]
SIGNATURE COMPLÉTÉE
    ↓ [Action: Transférer les clés]
TRANSACTION COMPLÉTÉE
```

---

## 🏗️ Architecture du système

### Composants principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transaction  │  │   Actions    │  │  Timeline    │      │
│  │   Details    │  │   Panel      │  │   View       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transaction  │  │   Action     │  │  Deadline    │      │
│  │   Router     │  │   Engine     │  │  Manager     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ transactions │  │   actions    │  │  deadlines   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1 : Base de données et modèles

### 1.1 Créer les modèles SQLAlchemy

**Fichier** : `backend/app/models/transaction_action.py`

```python
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
    transaction = relationship("RealEstateTransaction", backref="action_completions", lazy="select")
    action = relationship("TransactionAction", back_populates="completions", lazy="select")
    user = relationship("User", lazy="select")
```

### 1.2 Créer la migration Alembic

**Fichier** : `backend/alembic/versions/XXXX_add_transaction_actions.py`

```python
"""Add transaction actions system

Revision ID: XXXX
Revises: YYYY
Create Date: 2025-01-XX
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Créer la table transaction_actions
    op.create_table(
        'transaction_actions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('from_status', sa.String(length=50), nullable=False),
        sa.Column('to_status', sa.String(length=50), nullable=False),
        sa.Column('required_documents', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('required_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('required_roles', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('creates_deadline', sa.Boolean(), nullable=True),
        sa.Column('deadline_days', sa.Integer(), nullable=True),
        sa.Column('deadline_type', sa.String(length=50), nullable=True),
        sa.Column('generates_document', sa.Boolean(), nullable=True),
        sa.Column('document_template', sa.String(length=100), nullable=True),
        sa.Column('sends_notification', sa.Boolean(), nullable=True),
        sa.Column('notification_recipients', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_transaction_actions_code'), 'transaction_actions', ['code'], unique=True)
    op.create_index(op.f('ix_transaction_actions_id'), 'transaction_actions', ['id'], unique=False)

    # Créer la table action_completions
    op.create_table(
        'action_completions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('action_code', sa.String(length=50), nullable=False),
        sa.Column('completed_by', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('previous_status', sa.String(length=50), nullable=False),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['action_code'], ['transaction_actions.code'], ),
        sa.ForeignKeyConstraint(['completed_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['real_estate_transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_action_completions_action_code'), 'action_completions', ['action_code'], unique=False)
    op.create_index(op.f('ix_action_completions_completed_at'), 'action_completions', ['completed_at'], unique=False)
    op.create_index(op.f('ix_action_completions_transaction_id'), 'action_completions', ['transaction_id'], unique=False)

    # Ajouter des colonnes à la table transactions
    op.add_column('real_estate_transactions', sa.Column('current_action_code', sa.String(length=50), nullable=True))
    op.add_column('real_estate_transactions', sa.Column('last_action_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('real_estate_transactions', sa.Column('action_count', sa.Integer(), nullable=True, server_default='0'))
    
    op.create_foreign_key(
        'fk_transaction_current_action',
        'real_estate_transactions',
        'transaction_actions',
        ['current_action_code'],
        ['code']
    )

def downgrade():
    op.drop_constraint('fk_transaction_current_action', 'real_estate_transactions', type_='foreignkey')
    op.drop_column('real_estate_transactions', 'action_count')
    op.drop_column('real_estate_transactions', 'last_action_at')
    op.drop_column('real_estate_transactions', 'current_action_code')
    op.drop_index(op.f('ix_action_completions_transaction_id'), table_name='action_completions')
    op.drop_index(op.f('ix_action_completions_completed_at'), table_name='action_completions')
    op.drop_index(op.f('ix_action_completions_action_code'), table_name='action_completions')
    op.drop_table('action_completions')
    op.drop_index(op.f('ix_transaction_actions_id'), table_name='transaction_actions')
    op.drop_index(op.f('ix_transaction_actions_code'), table_name='transaction_actions')
    op.drop_table('transaction_actions')
```

### 1.3 Mettre à jour le modèle RealEstateTransaction

**Fichier** : `backend/app/models/real_estate_transaction.py`

Ajouter les colonnes :
```python
current_action_code = Column(String(50), ForeignKey("transaction_actions.code"), nullable=True)
last_action_at = Column(DateTime(timezone=True), nullable=True)
action_count = Column(Integer, default=0, nullable=True)
```

---

## 🧠 Phase 2 : Configuration et logique métier

### 2.1 Créer le fichier de configuration des actions

**Fichier** : `backend/app/config/transaction_actions.py`

```python
"""
Configuration des actions de transaction immobilière
Définit toutes les actions possibles et leurs règles
"""

TRANSACTION_ACTIONS = [
    # ===== NOUVELLE INSCRIPTION → PROPRIÉTÉ LISTÉE =====
    {
        'code': 'publish_listing',
        'name': "Publier l'annonce",
        'description': 'Rendre la propriété visible sur les plateformes immobilières',
        'from_status': 'En cours',
        'to_status': 'Propriété listée',
        'required_documents': ['contrat_courtage', 'declaration_vendeur'],
        'required_fields': ['property_address', 'listing_price', 'property_description'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 90,
        'deadline_type': 'listing_expiry',
        'sends_notification': True,
        'notification_recipients': ['client', 'broker'],
        'order_index': 1,
    },

    # ===== PROPRIÉTÉ LISTÉE → OFFRE SOUMISE =====
    {
        'code': 'submit_offer',
        'name': "Soumettre une offre",
        'description': "Soumettre une promesse d'achat au vendeur",
        'from_status': 'Propriété listée',
        'to_status': 'Offre soumise',
        'required_documents': ['promesse_achat'],
        'required_fields': ['offered_price', 'buyers'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 3,
        'deadline_type': 'offer_response',
        'generates_document': True,
        'document_template': 'promesse_achat_PA',
        'sends_notification': True,
        'notification_recipients': ['seller', 'seller_broker', 'buyer'],
        'order_index': 2,
    },

    # ===== OFFRE SOUMISE → OFFRE ACCEPTÉE =====
    {
        'code': 'accept_offer',
        'name': "Accepter l'offre",
        'description': "Le vendeur accepte la promesse d'achat",
        'from_status': 'Offre soumise',
        'to_status': 'Offre acceptée',
        'required_documents': ['promesse_achat_signee'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 10,
        'deadline_type': 'inspection',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'buyer_broker', 'seller'],
        'order_index': 3,
    },

    # ===== OFFRE SOUMISE → CONTRE-OFFRE =====
    {
        'code': 'counter_offer',
        'name': 'Faire une contre-offre',
        'description': "Le vendeur propose des modifications à l'offre",
        'from_status': 'Offre soumise',
        'to_status': 'Contre-offre',
        'required_documents': ['contre_proposition'],
        'required_fields': ['counter_offer_price'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 2,
        'deadline_type': 'counter_offer_response',
        'generates_document': True,
        'document_template': 'contre_proposition_CP',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'buyer_broker'],
        'order_index': 4,
    },

    # ===== OFFRE ACCEPTÉE → INSPECTION COMPLÉTÉE =====
    {
        'code': 'complete_inspection',
        'name': "Compléter l'inspection",
        'description': "Inspection pré-achat effectuée et rapport reçu",
        'from_status': 'Offre acceptée',
        'to_status': 'Inspection complétée',
        'required_documents': ['rapport_inspection'],
        'required_fields': ['inspection_date', 'inspector_name'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 30,
        'deadline_type': 'financing',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker'],
        'order_index': 5,
    },

    # ===== INSPECTION COMPLÉTÉE → FINANCEMENT APPROUVÉ =====
    {
        'code': 'approve_financing',
        'name': 'Obtenir le financement',
        'description': "Approbation hypothécaire confirmée par l'institution financière",
        'from_status': 'Inspection complétée',
        'to_status': 'Financement approuvé',
        'required_documents': ['lettre_engagement_hypothecaire'],
        'required_fields': ['mortgage_advisor_institution', 'financing_approval_date'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 14,
        'deadline_type': 'notary_signing',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 6,
    },

    # ===== FINANCEMENT APPROUVÉ → SIGNATURE COMPLÉTÉE =====
    {
        'code': 'complete_signing',
        'name': 'Signer chez le notaire',
        'description': "Signature de l'acte de vente chez le notaire",
        'from_status': 'Financement approuvé',
        'to_status': 'Signature complétée',
        'required_documents': ['acte_vente'],
        'required_fields': ['notary_name', 'sale_act_signing_date'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': True,
        'deadline_days': 7,
        'deadline_type': 'key_transfer',
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 7,
    },

    # ===== SIGNATURE COMPLÉTÉE → TRANSACTION COMPLÉTÉE =====
    {
        'code': 'transfer_keys',
        'name': 'Transférer les clés',
        'description': 'Remise des clés et prise de possession',
        'from_status': 'Signature complétée',
        'to_status': 'Conclue',
        'required_fields': ['possession_date'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': False,
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 8,
    },

    # ===== ACTIONS SPÉCIALES =====
    {
        'code': 'cancel_transaction',
        'name': 'Annuler la transaction',
        'description': 'Annulation de la transaction pour raison valide',
        'from_status': '*',  # Peut être fait depuis n'importe quel statut
        'to_status': 'Annulée',
        'required_fields': ['cancellation_reason'],
        'required_roles': ['broker', 'admin'],
        'creates_deadline': False,
        'sends_notification': True,
        'notification_recipients': ['buyer', 'seller', 'buyer_broker', 'seller_broker'],
        'order_index': 99,
    },
]
```

### 2.2 Créer le service de gestion des actions

**Fichier** : `backend/app/services/transaction_action_service.py`

```python
"""
Service de gestion des actions de transaction
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, timedelta

from app.models import TransactionAction, ActionCompletion, RealEstateTransaction, User
from app.config.transaction_actions import TRANSACTION_ACTIONS
from app.core.logging import logger


class TransactionActionService:
    """Service pour gérer les actions de transaction"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_available_actions(self, transaction: RealEstateTransaction, user: User) -> List[TransactionAction]:
        """
        Récupère les actions disponibles pour une transaction donnée
        
        Args:
            transaction: La transaction immobilière
            user: L'utilisateur qui demande les actions
            
        Returns:
            Liste des actions disponibles
        """
        # Récupérer toutes les actions actives qui correspondent au statut actuel
        query = select(TransactionAction).where(
            and_(
                or_(
                    TransactionAction.from_status == transaction.status,
                    TransactionAction.from_status == '*'
                ),
                TransactionAction.is_active == True
            )
        ).order_by(TransactionAction.order_index)
        
        result = await self.db.execute(query)
        actions = result.scalars().all()
        
        # Filtrer par rôle si nécessaire
        filtered_actions = []
        for action in actions:
            required_roles = action.required_roles or []
            if not required_roles or user.role in required_roles:
                filtered_actions.append(action)
        
        return filtered_actions

    async def validate_action_prerequisites(
        self,
        action: TransactionAction,
        transaction: RealEstateTransaction,
        provided_data: Dict[str, Any]
    ) -> tuple[bool, List[str]]:
        """
        Valide les prérequis d'une action
        
        Returns:
            Tuple (is_valid, missing_items)
        """
        missing_items = []
        
        # Valider les champs requis
        required_fields = action.required_fields or []
        for field in required_fields:
            if field not in provided_data and not hasattr(transaction, field) or not getattr(transaction, field, None):
                missing_items.append(f"Champ requis: {field}")
        
        # Valider les documents requis (vérifier dans transaction.documents)
        required_documents = action.required_documents or []
        transaction_docs = transaction.documents or []
        doc_types = [doc.get('type') for doc in transaction_docs if isinstance(doc, dict)]
        
        for doc_type in required_documents:
            if doc_type not in doc_types:
                missing_items.append(f"Document requis: {doc_type}")
        
        return len(missing_items) == 0, missing_items

    async def execute_action(
        self,
        transaction_id: int,
        action_code: str,
        user: User,
        data: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exécute une action sur une transaction
        
        Returns:
            Dict avec les résultats de l'exécution
        """
        data = data or {}
        
        # 1. Récupérer la transaction
        transaction_result = await self.db.execute(
            select(RealEstateTransaction).where(RealEstateTransaction.id == transaction_id)
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise ValueError("Transaction introuvable")
        
        # 2. Récupérer l'action
        action_result = await self.db.execute(
            select(TransactionAction).where(TransactionAction.code == action_code)
        )
        action = action_result.scalar_one_or_none()
        
        if not action:
            raise ValueError("Action introuvable")
        
        # 3. Valider que l'action est disponible
        if action.from_status != '*' and action.from_status != transaction.status:
            raise ValueError(f"Cette action n'est pas disponible pour le statut actuel ({transaction.status})")
        
        # 4. Valider les prérequis
        is_valid, missing_items = await self.validate_action_prerequisites(action, transaction, data)
        if not is_valid:
            raise ValueError(f"Prérequis manquants: {', '.join(missing_items)}")
        
        # 5. Enregistrer l'action
        previous_status = transaction.status
        new_status = action.to_status
        
        completion = ActionCompletion(
            transaction_id=transaction_id,
            action_code=action_code,
            completed_by=user.id,
            data=data,
            notes=notes,
            previous_status=previous_status,
            new_status=new_status,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.db.add(completion)
        
        # 6. Mettre à jour la transaction
        transaction.status = new_status
        transaction.current_action_code = action_code
        transaction.last_action_at = datetime.now()
        transaction.action_count = (transaction.action_count or 0) + 1
        
        # Mettre à jour les champs fournis dans data
        for key, value in data.items():
            if hasattr(transaction, key):
                setattr(transaction, key, value)
        
        await self.db.commit()
        await self.db.refresh(completion)
        await self.db.refresh(transaction)
        
        # 7. Créer un délai si nécessaire
        deadline = None
        if action.creates_deadline and action.deadline_days:
            # TODO: Intégrer avec le système de délais existant
            deadline = {
                'type': action.deadline_type,
                'days': action.deadline_days,
                'due_date': (datetime.now() + timedelta(days=action.deadline_days)).isoformat()
            }
        
        # 8. Envoyer des notifications (TODO)
        if action.sends_notification:
            # await self._send_notifications(transaction, action, user)
            pass
        
        # 9. Générer un document si nécessaire (TODO)
        if action.generates_document:
            # await self._generate_document(transaction, action)
            pass
        
        return {
            'success': True,
            'completion': completion,
            'deadline': deadline,
            'new_status': new_status,
            'previous_status': previous_status
        }

    async def get_action_history(self, transaction_id: int) -> List[ActionCompletion]:
        """Récupère l'historique des actions d'une transaction"""
        result = await self.db.execute(
            select(ActionCompletion)
            .where(ActionCompletion.transaction_id == transaction_id)
            .order_by(ActionCompletion.completed_at.desc())
        )
        return result.scalars().all()

    async def seed_actions(self) -> int:
        """Initialise les actions dans la base de données"""
        count = 0
        for action_data in TRANSACTION_ACTIONS:
            # Vérifier si l'action existe déjà
            existing = await self.db.execute(
                select(TransactionAction).where(TransactionAction.code == action_data['code'])
            )
            existing_action = existing.scalar_one_or_none()
            
            if existing_action:
                # Mettre à jour
                for key, value in action_data.items():
                    setattr(existing_action, key, value)
                existing_action.updated_at = datetime.now()
            else:
                # Créer
                new_action = TransactionAction(**action_data)
                self.db.add(new_action)
                count += 1
        
        await self.db.commit()
        return count
```

---

## 🔧 Phase 3 : Backend API

### 3.1 Créer les schémas Pydantic

**Fichier** : `backend/app/schemas/transaction_action.py`

```python
"""
Schemas pour les actions de transaction
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TransactionActionResponse(BaseModel):
    """Schéma de réponse pour une action"""
    id: int
    code: str
    name: str
    description: Optional[str] = None
    from_status: str
    to_status: str
    required_documents: List[str] = Field(default_factory=list)
    required_fields: List[str] = Field(default_factory=list)
    required_roles: List[str] = Field(default_factory=list)
    creates_deadline: bool = False
    deadline_days: Optional[int] = None
    deadline_type: Optional[str] = None
    generates_document: bool = False
    document_template: Optional[str] = None
    sends_notification: bool = True
    notification_recipients: List[str] = Field(default_factory=list)
    order_index: int = 0
    is_active: bool = True
    
    class Config:
        from_attributes = True


class ActionCompletionResponse(BaseModel):
    """Schéma de réponse pour une action complétée"""
    id: int
    transaction_id: int
    action_code: str
    action_name: Optional[str] = None
    completed_by: int
    completed_by_name: Optional[str] = None
    completed_at: datetime
    data: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    previous_status: str
    new_status: str
    
    class Config:
        from_attributes = True


class ExecuteActionRequest(BaseModel):
    """Schéma de requête pour exécuter une action"""
    action_code: str
    data: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class ExecuteActionResponse(BaseModel):
    """Schéma de réponse après exécution d'une action"""
    success: bool
    completion_id: int
    new_status: str
    previous_status: str
    deadline: Optional[Dict[str, Any]] = None
```

### 3.2 Créer les endpoints API

**Fichier** : `backend/app/api/v1/endpoints/transaction_actions.py`

```python
"""
Transaction Actions Endpoints
Endpoints pour gérer les actions de transaction immobilière
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models import User, RealEstateTransaction
from app.schemas.transaction_action import (
    TransactionActionResponse,
    ActionCompletionResponse,
    ExecuteActionRequest,
    ExecuteActionResponse
)
from app.services.transaction_action_service import TransactionActionService
from app.core.logging import logger

router = APIRouter(prefix="/transactions", tags=["transaction-actions"])


@router.get("/{transaction_id}/actions/available", response_model=List[TransactionActionResponse])
async def get_available_actions(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Récupère les actions disponibles pour une transaction
    """
    try:
        # Vérifier que la transaction existe et appartient à l'utilisateur
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
        
        service = TransactionActionService(db)
        actions = await service.get_available_actions(transaction, current_user)
        
        return [TransactionActionResponse.model_validate(action) for action in actions]
        
    except Exception as e:
        logger.error(f"Error getting available actions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des actions"
        )


@router.get("/{transaction_id}/actions/history", response_model=List[ActionCompletionResponse])
async def get_action_history(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Récupère l'historique des actions d'une transaction
    """
    try:
        # Vérifier que la transaction existe et appartient à l'utilisateur
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
        
        service = TransactionActionService(db)
        history = await service.get_action_history(transaction_id)
        
        # Enrichir avec les noms d'action et d'utilisateur
        completions = []
        for completion in history:
            completion_dict = ActionCompletionResponse.model_validate(completion).model_dump()
            if completion.action:
                completion_dict['action_name'] = completion.action.name
            if completion.user:
                completion_dict['completed_by_name'] = f"{completion.user.first_name} {completion.user.last_name}".strip()
            completions.append(completion_dict)
        
        return completions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting action history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération de l'historique"
        )


@router.post("/{transaction_id}/actions/execute", response_model=ExecuteActionResponse)
async def execute_action(
    transaction_id: int,
    request_data: ExecuteActionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Exécute une action sur une transaction
    """
    try:
        # Vérifier que la transaction existe et appartient à l'utilisateur
        transaction_result = await db.execute(
            select(RealEstateTransaction).where(
                and_(
                    RealEstateTransaction.id == transaction_id,
                    RealEstateTransaction.user_id == current_user.id
                )
            )
        )
        transaction = transaction_result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction introuvable"
            )
        
        service = TransactionActionService(db)
        
        # Récupérer l'IP et user agent
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        result = await service.execute_action(
            transaction_id=transaction_id,
            action_code=request_data.action_code,
            user=current_user,
            data=request_data.data,
            notes=request_data.notes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return ExecuteActionResponse(
            success=True,
            completion_id=result['completion'].id,
            new_status=result['new_status'],
            previous_status=result['previous_status'],
            deadline=result.get('deadline')
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing action: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'exécution de l'action"
        )


@router.post("/actions/seed", status_code=status.HTTP_201_CREATED)
async def seed_actions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initialise les actions dans la base de données (admin seulement)
    """
    # TODO: Vérifier que l'utilisateur est admin
    # if current_user.role != 'admin':
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    
    try:
        service = TransactionActionService(db)
        count = await service.seed_actions()
        
        return {"success": True, "count": count, "message": f"{count} actions initialisées"}
        
    except Exception as e:
        logger.error(f"Error seeding actions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'initialisation des actions"
        )
```

### 3.3 Enregistrer le router

**Fichier** : `backend/app/api/v1/router.py`

Ajouter :
```python
from app.api.v1.endpoints import transaction_actions

api_router.include_router(
    transaction_actions.router,
    tags=["transaction-actions"]
)
```

---

## 🎨 Phase 4 : Frontend

### 4.1 Créer le client API

**Fichier** : `apps/web/src/lib/api/transaction-actions.ts`

```typescript
/**
 * Transaction Actions API Client
 */

import { apiClient } from './client';

export interface TransactionAction {
  id: number;
  code: string;
  name: string;
  description?: string;
  from_status: string;
  to_status: string;
  required_documents: string[];
  required_fields: string[];
  required_roles: string[];
  creates_deadline: boolean;
  deadline_days?: number;
  deadline_type?: string;
  generates_document: boolean;
  document_template?: string;
  sends_notification: boolean;
  notification_recipients: string[];
  order_index: number;
  is_active: boolean;
}

export interface ActionCompletion {
  id: number;
  transaction_id: number;
  action_code: string;
  action_name?: string;
  completed_by: number;
  completed_by_name?: string;
  completed_at: string;
  data: Record<string, any>;
  notes?: string;
  previous_status: string;
  new_status: string;
}

export interface ExecuteActionRequest {
  action_code: string;
  data?: Record<string, any>;
  notes?: string;
}

export interface ExecuteActionResponse {
  success: boolean;
  completion_id: number;
  new_status: string;
  previous_status: string;
  deadline?: {
    type: string;
    days: number;
    due_date: string;
  };
}

/**
 * Récupère les actions disponibles pour une transaction
 */
export async function getAvailableActions(transactionId: number): Promise<TransactionAction[]> {
  const response = await apiClient.get<TransactionAction[]>(
    `/v1/transactions/${transactionId}/actions/available`
  );
  return response.data;
}

/**
 * Récupère l'historique des actions d'une transaction
 */
export async function getActionHistory(transactionId: number): Promise<ActionCompletion[]> {
  const response = await apiClient.get<ActionCompletion[]>(
    `/v1/transactions/${transactionId}/actions/history`
  );
  return response.data;
}

/**
 * Exécute une action sur une transaction
 */
export async function executeAction(
  transactionId: number,
  request: ExecuteActionRequest
): Promise<ExecuteActionResponse> {
  const response = await apiClient.post<ExecuteActionResponse>(
    `/v1/transactions/${transactionId}/actions/execute`,
    request
  );
  return response.data;
}
```

### 4.2 Créer le composant Actions Panel

**Fichier** : `apps/web/src/components/transactions/TransactionActionsPanel.tsx`

(Voir le code complet dans le document original)

### 4.3 Créer le composant Timeline

**Fichier** : `apps/web/src/components/transactions/TransactionTimeline.tsx`

(Voir le code complet dans le document original)

### 4.4 Intégrer dans la page de détails

**Fichier** : `apps/web/src/app/[locale]/dashboard/transactions/[id]/page.tsx`

Ajouter les composants dans les onglets appropriés.

---

## ⚙️ Phase 5 : Page de gestion des paramètres

### 5.1 Créer la page de configuration

**Fichier** : `apps/web/src/app/[locale]/dashboard/modules/admin/transaction-actions/page.tsx`

Page complète pour :
- Voir toutes les actions configurées
- Modifier les actions existantes
- Créer de nouvelles actions
- Activer/désactiver des actions
- Gérer l'ordre d'affichage
- Tester les actions

---

## ✅ Checklist d'implémentation

### Phase 1 : Base de données ✅
- [ ] Créer les modèles `TransactionAction` et `ActionCompletion`
- [ ] Créer la migration Alembic
- [ ] Ajouter les colonnes à `RealEstateTransaction`
- [ ] Exécuter `alembic upgrade head`
- [ ] Tester la création des tables

### Phase 2 : Configuration ✅
- [ ] Créer `backend/app/config/transaction_actions.py`
- [ ] Créer `backend/app/services/transaction_action_service.py`
- [ ] Implémenter toutes les méthodes du service
- [ ] Tester le service avec des données de test

### Phase 3 : Backend API ✅
- [ ] Créer les schémas Pydantic
- [ ] Créer les endpoints API
- [ ] Enregistrer le router
- [ ] Tester les endpoints avec Postman/Thunder Client

### Phase 4 : Frontend ✅
- [ ] Créer le client API TypeScript
- [ ] Créer le composant `TransactionActionsPanel`
- [ ] Créer le composant `TransactionTimeline`
- [ ] Intégrer dans la page de détails de transaction
- [ ] Tester le flow complet

### Phase 5 : Page de gestion ✅
- [ ] Créer la page de configuration des actions
- [ ] Implémenter CRUD pour les actions
- [ ] Ajouter la validation côté frontend
- [ ] Tester toutes les fonctionnalités

### Phase 6 : Fonctionnalités avancées
- [ ] Intégrer avec le système de délais existant
- [ ] Implémenter l'envoi de notifications
- [ ] Implémenter la génération de documents
- [ ] Ajouter la validation des documents requis
- [ ] Créer des tests unitaires et d'intégration

---

## 📝 Notes importantes

1. **Compatibilité avec l'existant** : Le système doit s'intégrer avec le modèle `RealEstateTransaction` existant sans casser les fonctionnalités actuelles.

2. **Statuts existants** : Les statuts actuels sont : "En cours", "Conditionnelle", "Ferme", "Annulée", "Conclue". Il faudra peut-être adapter les statuts dans la configuration.

3. **Permissions** : Le système doit respecter les permissions existantes (user_id sur les transactions).

4. **Migration des données** : Si des transactions existent déjà, il faudra peut-être créer des actions de complétion rétroactives.

5. **Tests** : Créer des tests pour chaque phase avant de passer à la suivante.

---

## 🚀 Ordre d'implémentation recommandé

1. **Phase 1** : Base de données (fondation)
2. **Phase 2** : Configuration et service (logique métier)
3. **Phase 3** : Backend API (exposition)
4. **Phase 4** : Frontend de base (UI)
5. **Phase 5** : Page de gestion (administration)
6. **Phase 6** : Fonctionnalités avancées (améliorations)

---

**Document créé le** : 2025-01-XX  
**Dernière mise à jour** : 2025-01-XX
