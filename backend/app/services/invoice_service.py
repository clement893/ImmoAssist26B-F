"""
Invoice Service
Service for managing invoices
"""

from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import json

from app.models import Invoice, Subscription, User
from app.models.invoice import InvoiceStatus
from app.core.logging import logger


class InvoiceService:
    """Service for managing invoices"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_invoice_by_stripe_id(self, stripe_invoice_id: str) -> Optional[Invoice]:
        """Get invoice by Stripe invoice ID"""
        result = await self.db.execute(
            select(Invoice).where(Invoice.stripe_invoice_id == stripe_invoice_id)
        )
        return result.scalar_one_or_none()

    async def get_user_invoices(
        self, 
        user_id: int, 
        limit: int = 50,
        include_subscription: bool = True
    ) -> List[Invoice]:
        """Get all invoices for a user"""
        query = (
            select(Invoice)
            .where(Invoice.user_id == user_id)
            .order_by(Invoice.created_at.desc())
            .limit(limit)
        )
        
        if include_subscription:
            query = query.options(selectinload(Invoice.subscription))
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_or_update_invoice(
        self,
        stripe_invoice_id: str,
        user_id: int,
        subscription_id: Optional[int] = None,
        amount_due: Optional[Decimal] = None,
        amount_paid: Optional[Decimal] = None,
        currency: str = "usd",
        status: Optional[InvoiceStatus] = None,
        due_date: Optional[datetime] = None,
        paid_at: Optional[datetime] = None,
        invoice_pdf_url: Optional[str] = None,
        hosted_invoice_url: Optional[str] = None,
        stripe_payment_intent_id: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Invoice:
        """Create or update invoice from Stripe webhook"""
        # Check if invoice already exists
        invoice = await self.get_invoice_by_stripe_id(stripe_invoice_id)
        
        if invoice:
            # Update existing invoice
            if amount_due is not None:
                invoice.amount_due = amount_due
            if amount_paid is not None:
                invoice.amount_paid = amount_paid
            if currency:
                invoice.currency = currency
            if status:
                invoice.status = status
            if due_date:
                invoice.due_date = due_date
            if paid_at:
                invoice.paid_at = paid_at
            if invoice_pdf_url:
                invoice.invoice_pdf_url = invoice_pdf_url
            if hosted_invoice_url:
                invoice.hosted_invoice_url = hosted_invoice_url
            if stripe_payment_intent_id:
                invoice.stripe_payment_intent_id = stripe_payment_intent_id
            if metadata:
                invoice.invoice_metadata = json.dumps(metadata)
            
            await self.db.commit()
            # Refresh non nécessaire, l'objet est déjà modifié en mémoire
            logger.info(f"Updated invoice {invoice.id} from Stripe invoice {stripe_invoice_id}")
            return invoice
        
        # Create new invoice
        invoice = Invoice(
            stripe_invoice_id=stripe_invoice_id,
            user_id=user_id,
            subscription_id=subscription_id,
            amount_due=amount_due or Decimal("0.00"),
            amount_paid=amount_paid or Decimal("0.00"),
            currency=currency,
            status=status or InvoiceStatus.DRAFT,
            due_date=due_date,
            paid_at=paid_at,
            invoice_pdf_url=invoice_pdf_url,
            hosted_invoice_url=hosted_invoice_url,
            stripe_payment_intent_id=stripe_payment_intent_id,
            metadata=json.dumps(metadata) if metadata else None,
        )
        
        self.db.add(invoice)
        await self.db.commit()
        # Refresh non nécessaire si pas besoin de relations lazy-loaded immédiatement
        logger.info(f"Created invoice {invoice.id} from Stripe invoice {stripe_invoice_id}")
        return invoice

    async def update_invoice_status(
        self,
        stripe_invoice_id: str,
        status: InvoiceStatus,
        paid_at: Optional[datetime] = None,
    ) -> Optional[Invoice]:
        """Update invoice status"""
        invoice = await self.get_invoice_by_stripe_id(stripe_invoice_id)
        if not invoice:
            logger.warning(f"Invoice with stripe_invoice_id {stripe_invoice_id} not found")
            return None
        
        invoice.status = status
        if paid_at:
            invoice.paid_at = paid_at
        if status == InvoiceStatus.PAID and not invoice.amount_paid:
            # If marked as paid but amount_paid is 0, set it to amount_due
            invoice.amount_paid = invoice.amount_due
        
        await self.db.commit()
        # Refresh non nécessaire, l'objet est déjà modifié en mémoire
        return invoice

    async def get_invoice(self, invoice_id: int, include_subscription: bool = True) -> Optional[Invoice]:
        """Get invoice by ID"""
        query = select(Invoice).where(Invoice.id == invoice_id)
        
        if include_subscription:
            query = query.options(selectinload(Invoice.subscription))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

