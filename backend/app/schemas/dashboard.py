"""
Dashboard Schemas
Schemas pour les statistiques du dashboard des courtiers immobiliers
"""

from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class BrokerDashboardStats(BaseModel):
    """Statistiques du dashboard pour les courtiers immobiliers"""
    
    # Transactions
    total_transactions: int = 0
    active_transactions: int = 0
    conditional_transactions: int = 0
    closed_transactions: int = 0
    cancelled_transactions: int = 0
    
    # Contacts
    total_contacts: int = 0
    total_companies: int = 0
    
    # Financier
    total_commission: Optional[Decimal] = None
    pending_commission: Optional[Decimal] = None
    closed_commission: Optional[Decimal] = None
    
    # Calendrier
    upcoming_events: int = 0
    
    # Formulaires
    total_forms: int = 0
    pending_submissions: int = 0
