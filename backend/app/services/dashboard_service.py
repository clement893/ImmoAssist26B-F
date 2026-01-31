"""
Dashboard Service
Service pour récupérer les statistiques du dashboard des courtiers immobiliers
"""

from sqlalchemy import select, func, case, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from decimal import Decimal

from app.models.real_estate_transaction import RealEstateTransaction
from app.models.contact import Contact
from app.models.company import Company
from app.models.form import Form, FormSubmission
from app.schemas.dashboard import BrokerDashboardStats


class DashboardService:
    """Service pour les statistiques du dashboard"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_broker_dashboard_stats(self, user_id: int) -> BrokerDashboardStats:
        """
        Récupère les statistiques du dashboard pour un courtier immobilier
        
        Args:
            user_id: ID de l'utilisateur courtier
            
        Returns:
            BrokerDashboardStats avec toutes les statistiques
        """
        # Statistiques des transactions
        transaction_stats_query = select(
            func.count(RealEstateTransaction.id).label("total"),
            func.count(
                case((RealEstateTransaction.status == "En cours", 1), else_=None)
            ).label("active"),
            func.count(
                case((RealEstateTransaction.status == "Conditionnelle", 1), else_=None)
            ).label("conditional"),
            func.count(
                case((RealEstateTransaction.status == "Conclue", 1), else_=None)
            ).label("closed"),
            func.count(
                case((RealEstateTransaction.status == "Annulée", 1), else_=None)
            ).label("cancelled"),
            func.sum(
                case(
                    (RealEstateTransaction.status == "Conclue", RealEstateTransaction.broker_commission_amount),
                    else_=None
                )
            ).label("closed_commission"),
            func.sum(
                case(
                    (
                        or_(
                            RealEstateTransaction.status == "En cours",
                            RealEstateTransaction.status == "Conditionnelle"
                        ),
                        RealEstateTransaction.broker_commission_amount
                    ),
                    else_=None
                )
            ).label("pending_commission"),
            func.sum(RealEstateTransaction.broker_commission_amount).label("total_commission"),
        ).where(RealEstateTransaction.user_id == user_id)
        
        transaction_result = await self.db.execute(transaction_stats_query)
        transaction_stats = transaction_result.first()
        
        # Statistiques des contacts (filtrés par employee_id)
        contacts_query = select(func.count(Contact.id)).where(Contact.employee_id == user_id)
        contacts_result = await self.db.execute(contacts_query)
        total_contacts = contacts_result.scalar() or 0
        
        # Statistiques des entreprises (pas de filtre par utilisateur dans le modèle actuel)
        # On compte toutes les entreprises pour l'instant
        companies_query = select(func.count(Company.id))
        companies_result = await self.db.execute(companies_query)
        total_companies = companies_result.scalar() or 0
        
        # Événements à venir (dans les 30 prochains jours)
        # Note: On suppose qu'il y a un modèle CalendarEvent ou similaire
        # Pour l'instant, on retourne 0
        upcoming_events = 0
        
        # Statistiques des formulaires
        forms_query = select(func.count(Form.id)).where(Form.user_id == user_id)
        forms_result = await self.db.execute(forms_query)
        total_forms = forms_result.scalar() or 0
        
        # Soumissions en attente
        pending_submissions_query = select(
            func.count(FormSubmission.id)
        ).join(Form).where(
            and_(
                Form.user_id == user_id,
                FormSubmission.status == "pending"
            )
        )
        pending_submissions_result = await self.db.execute(pending_submissions_query)
        pending_submissions = pending_submissions_result.scalar() or 0
        
        return BrokerDashboardStats(
            total_transactions=transaction_stats.total or 0,
            active_transactions=transaction_stats.active or 0,
            conditional_transactions=transaction_stats.conditional or 0,
            closed_transactions=transaction_stats.closed or 0,
            cancelled_transactions=transaction_stats.cancelled or 0,
            total_contacts=total_contacts,
            total_companies=total_companies,
            total_commission=transaction_stats.total_commission or Decimal("0.00"),
            pending_commission=transaction_stats.pending_commission or Decimal("0.00"),
            closed_commission=transaction_stats.closed_commission or Decimal("0.00"),
            upcoming_events=upcoming_events,
            total_forms=total_forms,
            pending_submissions=pending_submissions,
        )
