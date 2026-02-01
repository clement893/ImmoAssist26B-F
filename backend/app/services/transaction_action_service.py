"""
Service de gestion des actions de transaction
"""

from typing import List, Optional, Dict, Any, Tuple
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
            if not required_roles or (hasattr(user, 'role') and user.role in required_roles):
                filtered_actions.append(action)
        
        return filtered_actions

    async def validate_action_prerequisites(
        self,
        action: TransactionAction,
        transaction: RealEstateTransaction,
        provided_data: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Valide les prérequis d'une action
        
        Returns:
            Tuple (is_valid, missing_items)
        """
        missing_items = []
        
        # Valider les champs requis
        required_fields = action.required_fields or []
        for field in required_fields:
            field_value = provided_data.get(field) or getattr(transaction, field, None)
            if not field_value:
                missing_items.append(f"Champ requis: {field}")
        
        # Valider les documents requis (vérifier dans transaction.documents)
        required_documents = action.required_documents or []
        if required_documents:
            transaction_docs = transaction.documents or []
            if isinstance(transaction_docs, list):
                doc_types = [doc.get('type') if isinstance(doc, dict) else str(doc) for doc in transaction_docs]
            else:
                doc_types = []
            
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
