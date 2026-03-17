"""
Stripe Webhooks
Handle Stripe webhook events
"""

from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from sqlalchemy import select
import stripe
# Note: In recent Stripe versions, exceptions are directly in stripe module, not stripe.error
import os

from app.core.database import get_db
from app.services.stripe_service import StripeService
from app.services.subscription_service import SubscriptionService
from app.services.invoice_service import InvoiceService
from app.services.email_service import EmailService
from app.services.email_templates import EmailTemplates
# from app.services.booking_service import BookingService  # Removed: booking service depends on masterclass models
from app.utils.stripe_helpers import map_stripe_status, parse_timestamp
from app.core.logging import logger
from app.models import Subscription, WebhookEvent, User
from app.models.invoice import InvoiceStatus
from app.models.booking import Booking, BookingStatus, PaymentStatus

router = APIRouter(prefix="/webhooks/stripe", tags=["webhooks"])


async def check_event_processed(event_id: str, db: AsyncSession) -> bool:
    """Check if webhook event has already been processed (idempotency)"""
    if not event_id:
        return False
    
    result = await db.execute(
        select(WebhookEvent).where(WebhookEvent.stripe_event_id == event_id)
    )
    return result.scalar_one_or_none() is not None


async def mark_event_processed(
    event_id: str,
    event_type: str,
    event_data: dict,
    db: AsyncSession
) -> None:
    """Mark webhook event as processed"""
    if not event_id:
        return
    
    import json
    
    webhook_event = WebhookEvent(
        stripe_event_id=event_id,
        event_type=event_type,
        event_data=json.dumps(event_data) if event_data else None,
    )
    db.add(webhook_event)
    await db.commit()


@router.post("")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    
    stripe_service = StripeService(db)
    subscription_service = SubscriptionService(db)
    invoice_service = InvoiceService(db)
    
    try:
        event_data = await stripe_service.handle_webhook(payload, stripe_signature)
        event_type = event_data["type"]
        event_object = event_data["data"]["object"]
        event_id = event_data.get("id")  # Stripe event ID for idempotency
        
        logger.info(f"Stripe webhook received: {event_type} (event_id: {event_id})")
        
        # Idempotency check: prevent duplicate processing
        if await check_event_processed(event_id, db):
            logger.info(f"Event {event_id} already processed, skipping")
            return {"status": "success", "message": "Event already processed"}
        
        # Handle different event types
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(event_object, db, subscription_service)
        
        elif event_type == "customer.subscription.created":
            await handle_subscription_created(event_object, db, subscription_service)
        
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event_object, db, subscription_service)
        
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event_object, db, subscription_service)
        
        elif event_type == "invoice.paid":
            await handle_invoice_paid(event_object, db, invoice_service, subscription_service)
        
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(event_object, db, invoice_service, subscription_service)
        
        elif event_type == "payment_intent.succeeded":
            await handle_payment_intent_succeeded(event_object, db)
        
        elif event_type == "payment_intent.payment_failed":
            await handle_payment_intent_failed(event_object, db)
        
        else:
            logger.debug(f"Unhandled webhook event type: {event_type}")
        
        # Mark event as processed after successful handling
        await mark_event_processed(event_id, event_type, event_data, db)
        
        return {"status": "success"}
    
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payload: {str(e)}"
        )
    except stripe.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}"
        )


async def handle_checkout_completed(event_object: dict, db: AsyncSession, subscription_service: SubscriptionService):
    """Handle checkout.session.completed event"""
    from app.core.config import settings
    
    customer_id = event_object.get("customer")
    subscription_id = event_object.get("subscription")
    metadata = event_object.get("metadata", {})
    
    # Safely extract user_id and plan_id
    user_id_str = metadata.get("user_id")
    plan_id_str = metadata.get("plan_id")
    
    if not user_id_str or not plan_id_str:
        logger.warning("Missing user_id or plan_id in checkout metadata")
        return
    
    try:
        user_id = int(user_id_str)
        plan_id = int(plan_id_str)
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid user_id or plan_id in checkout metadata: {e}")
        return
    
    # Check if subscription already exists (race condition protection)
    if subscription_id:
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            logger.info(f"Subscription {subscription_id} already exists, skipping creation")
            return
    
    # For checkout.session.completed, subscription_id might be None for one-time payments
    # In that case, we should still create a subscription record if it's a subscription checkout
    if not subscription_id:
        logger.warning(f"Checkout completed but no subscription_id for user {user_id}, plan {plan_id}")
        # Check if this is a subscription checkout by checking mode
        # If it's not a subscription, we might not want to create a subscription record
        # For now, we'll skip creation if no subscription_id
        return
    
    # Get subscription details from Stripe if subscription_id exists
    trial_end = None
    current_period_start = None
    current_period_end = None
    
    if subscription_id:
        try:
            # Initialize Stripe if needed
            if not stripe.api_key and hasattr(settings, 'STRIPE_SECRET_KEY') and settings.STRIPE_SECRET_KEY:
                stripe.api_key = settings.STRIPE_SECRET_KEY
            
            stripe_subscription = stripe.Subscription.retrieve(subscription_id)
            
            if stripe_subscription.trial_end:
                trial_end = datetime.fromtimestamp(stripe_subscription.trial_end, tz=timezone.utc)
            
            if stripe_subscription.current_period_start:
                current_period_start = datetime.fromtimestamp(
                    stripe_subscription.current_period_start, 
                    tz=timezone.utc
                )
            
            if stripe_subscription.current_period_end:
                current_period_end = datetime.fromtimestamp(
                    stripe_subscription.current_period_end,
                    tz=timezone.utc
                )
        except Exception as e:
            logger.warning(f"Could not retrieve Stripe subscription details: {e}")
            # Continue without Stripe details
    
    # Create subscription
    await subscription_service.create_subscription(
        user_id=user_id,
        plan_id=plan_id,
        stripe_subscription_id=subscription_id,
        stripe_customer_id=customer_id,
        trial_end=trial_end,
        current_period_start=current_period_start,
        current_period_end=current_period_end,
    )


def _parse_subscription_periods(event_object: dict) -> tuple[datetime | None, datetime | None]:
    """Parse subscription period start and end from Stripe event"""
    period_start = None
    period_end = None
    
    if start_ts := parse_timestamp(event_object.get("current_period_start", 0)):
        period_start = datetime.fromtimestamp(start_ts, tz=timezone.utc)
    if end_ts := parse_timestamp(event_object.get("current_period_end", 0)):
        period_end = datetime.fromtimestamp(end_ts, tz=timezone.utc)
    
    return period_start, period_end


async def handle_subscription_created(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.created event"""
    subscription_id = event_object.get("id")
    if not subscription_id:
        logger.warning("customer.subscription.created event missing subscription ID")
        return
    
    status_str = event_object.get("status", "")
    status = map_stripe_status(status_str)
    period_start, period_end = _parse_subscription_periods(event_object)
    
    result = await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    
    if not result:
        logger.warning(f"Could not update subscription {subscription_id} - may not exist yet")


async def handle_subscription_updated(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.updated event"""
    subscription_id = event_object.get("id")
    if not subscription_id:
        logger.warning("customer.subscription.updated event missing subscription ID")
        return
    
    status_str = event_object.get("status", "")
    status = map_stripe_status(status_str)
    period_start, period_end = _parse_subscription_periods(event_object)
    
    result = await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=status,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    
    if not result:
        logger.warning(f"Could not update subscription {subscription_id} - subscription not found")


async def handle_subscription_deleted(
    event_object: dict, 
    db: AsyncSession, 
    subscription_service: SubscriptionService
):
    """Handle customer.subscription.deleted event"""
    from app.models.subscription import SubscriptionStatus
    
    subscription_id = event_object.get("id")
    if not subscription_id:
        logger.warning("customer.subscription.deleted event missing subscription ID")
        return
    
    result = await subscription_service.update_subscription_status(
        stripe_subscription_id=subscription_id,
        status=SubscriptionStatus.CANCELED,
    )
    
    if not result:
        logger.warning(f"Could not cancel subscription {subscription_id} - subscription not found")


async def handle_invoice_paid(
    event_object: dict,
    db: AsyncSession,
    invoice_service: InvoiceService,
    subscription_service: SubscriptionService
):
    """Handle invoice.paid event"""
    from decimal import Decimal
    
    stripe_invoice_id = event_object.get("id")
    if not stripe_invoice_id:
        logger.warning("invoice.paid event missing invoice ID")
        return
    
    try:
        # Extract invoice data from Stripe event
        customer_id = event_object.get("customer")
        subscription_id = event_object.get("subscription")
        amount_due = Decimal(str(event_object.get("amount_due", 0))) / 100  # Convert from cents
        amount_paid = Decimal(str(event_object.get("amount_paid", 0))) / 100
        currency = event_object.get("currency", "usd")
        due_date_ts = event_object.get("due_date")
        paid_at_ts = event_object.get("status_transitions", {}).get("paid_at")
        
        due_date = None
        if due_date_ts:
            due_date = datetime.fromtimestamp(due_date_ts, tz=timezone.utc)
        
        paid_at = None
        if paid_at_ts:
            paid_at = datetime.fromtimestamp(paid_at_ts, tz=timezone.utc)
        else:
            paid_at = datetime.now(timezone.utc)  # Use current time if not provided
        
        invoice_pdf_url = event_object.get("invoice_pdf")
        hosted_invoice_url = event_object.get("hosted_invoice_url")
        payment_intent_id = event_object.get("payment_intent")
        
        # Get user_id from subscription if available
        user_id = None
        subscription_db_id = None
        
        if subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == subscription_id
                )
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        # If no subscription, try to get user_id from customer metadata
        if not user_id and customer_id:
            # Try to find user by customer_id in subscriptions
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                ).order_by(Subscription.created_at.desc()).limit(1)
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        if not user_id:
            logger.warning(f"Could not find user_id for invoice {stripe_invoice_id}")
            return
        
        # Create or update invoice
        invoice = await invoice_service.create_or_update_invoice(
            stripe_invoice_id=stripe_invoice_id,
            user_id=user_id,
            subscription_id=subscription_db_id,
            amount_due=amount_due,
            amount_paid=amount_paid,
            currency=currency,
            status=InvoiceStatus.PAID,
            due_date=due_date,
            paid_at=paid_at,
            invoice_pdf_url=invoice_pdf_url,
            hosted_invoice_url=hosted_invoice_url,
            stripe_payment_intent_id=payment_intent_id,
        )
        
        logger.info(f"Invoice {invoice.id} marked as paid (Stripe invoice: {stripe_invoice_id})")
        
        # Send confirmation email to user
        try:
            # Get user information
            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if user and user.email:
                email_service = EmailService()
                if email_service.is_configured():
                    # Format invoice number
                    invoice_number = invoice.invoice_number or f"INV-{invoice.id}"
                    invoice_date = invoice.paid_at.strftime("%Y-%m-%d") if invoice.paid_at else datetime.now(timezone.utc).strftime("%Y-%m-%d")
                    user_name = f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0]
                    
                    # Send invoice confirmation email
                    email_service.send_invoice_email(
                        to_email=user.email,
                        name=user_name,
                        invoice_number=invoice_number,
                        invoice_date=invoice_date,
                        amount=float(invoice.amount_paid),
                        currency=invoice.currency.upper(),
                        invoice_url=hosted_invoice_url or invoice_pdf_url,
                    )
                    logger.info(f"Confirmation email sent to {user.email} for invoice {invoice.id}")
                else:
                    logger.warning("Email service not configured, skipping confirmation email")
            else:
                logger.warning(f"User {user_id} not found or has no email, skipping confirmation email")
        except Exception as email_error:
            # Don't fail the webhook if email sending fails
            logger.error(f"Failed to send confirmation email for invoice {invoice.id}: {email_error}", exc_info=True)
        
    except Exception as e:
        logger.error(f"Error handling invoice.paid event: {e}", exc_info=True)
        raise


async def handle_invoice_payment_failed(
    event_object: dict,
    db: AsyncSession,
    invoice_service: InvoiceService,
    subscription_service: SubscriptionService
):
    """Handle invoice.payment_failed event"""
    from decimal import Decimal
    from app.models.subscription import SubscriptionStatus
    
    stripe_invoice_id = event_object.get("id")
    if not stripe_invoice_id:
        logger.warning("invoice.payment_failed event missing invoice ID")
        return
    
    try:
        # Extract invoice data
        customer_id = event_object.get("customer")
        subscription_id = event_object.get("subscription")
        amount_due = Decimal(str(event_object.get("amount_due", 0))) / 100
        currency = event_object.get("currency", "usd")
        attempt_count = event_object.get("attempt_count", 0)
        next_payment_attempt_ts = event_object.get("next_payment_attempt")
        
        due_date = None
        if due_date_ts := event_object.get("due_date"):
            due_date = datetime.fromtimestamp(due_date_ts, tz=timezone.utc)
        
        next_payment_attempt = None
        if next_payment_attempt_ts:
            next_payment_attempt = datetime.fromtimestamp(next_payment_attempt_ts, tz=timezone.utc)
        
        # Get user_id from subscription
        user_id = None
        subscription_db_id = None
        
        if subscription_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == subscription_id
                )
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        # If no subscription, try to get user_id from customer
        if not user_id and customer_id:
            result = await db.execute(
                select(Subscription).where(
                    Subscription.stripe_customer_id == customer_id
                ).order_by(Subscription.created_at.desc()).limit(1)
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                user_id = subscription.user_id
                subscription_db_id = subscription.id
        
        if not user_id:
            logger.warning(f"Could not find user_id for invoice {stripe_invoice_id}")
            return
        
        # Determine invoice status based on attempt count
        # After multiple failures, Stripe may mark it as uncollectible
        invoice_status = InvoiceStatus.OPEN
        if attempt_count >= 3:  # After 3 failed attempts, consider uncollectible
            invoice_status = InvoiceStatus.UNCOLLECTIBLE
        
        # Create or update invoice with failed status
        invoice = await invoice_service.create_or_update_invoice(
            stripe_invoice_id=stripe_invoice_id,
            user_id=user_id,
            subscription_id=subscription_db_id,
            amount_due=amount_due,
            amount_paid=Decimal("0.00"),
            currency=currency,
            status=invoice_status,
            due_date=due_date,
        )
        
        logger.warning(
            f"Invoice {invoice.id} payment failed (Stripe invoice: {stripe_invoice_id}, "
            f"attempts: {attempt_count})"
        )
        
        # Log to monitoring system for alerting (critical payment failures)
        if attempt_count >= 3:
            logger.error(
                f"CRITICAL: Payment failed after {attempt_count} attempts for invoice {invoice.id}",
                extra={
                    "invoice_id": invoice.id,
                    "stripe_invoice_id": stripe_invoice_id,
                    "user_id": user_id,
                    "amount_due": str(amount_due),
                    "currency": currency,
                    "attempt_count": attempt_count,
                    "alert_level": "critical",
                }
            )
        else:
            logger.warning(
                f"Payment failed for invoice {invoice.id} (attempt {attempt_count})",
                extra={
                    "invoice_id": invoice.id,
                    "stripe_invoice_id": stripe_invoice_id,
                    "user_id": user_id,
                    "amount_due": str(amount_due),
                    "currency": currency,
                    "attempt_count": attempt_count,
                    "alert_level": "warning",
                }
            )
        
        # Update subscription status if this is the final attempt
        if subscription_db_id and attempt_count >= 3:
            result = await db.execute(
                select(Subscription).where(Subscription.id == subscription_db_id)
            )
            subscription = result.scalar_one_or_none()
            if subscription and subscription.status == SubscriptionStatus.ACTIVE:
                # Don't immediately cancel, but log for monitoring
                logger.warning(
                    f"Subscription {subscription.id} has multiple payment failures, "
                    f"consider updating status"
                )
        
        # Send notification email to user about payment failure
        try:
            # Get user information
            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if user and user.email:
                email_service = EmailService()
                if email_service.is_configured():
                    user_name = f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0]
                    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                    payment_url = f"{frontend_url}/subscriptions"
                    
                    # Create payment failure email content
                    subject = f"Échec du paiement - Tentative {attempt_count}"
                    html_content = f"""
                        <h2 style="color: #dc2626; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                            Échec du paiement
                        </h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Bonjour {user_name},
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Nous n'avons pas pu traiter le paiement de votre facture.
                        </p>
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                                Montant: {amount_due} {currency.upper()}
                            </p>
                            <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px;">
                                Tentative: {attempt_count}
                            </p>
                        </div>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Veuillez mettre à jour vos informations de paiement pour éviter l'interruption de service.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{payment_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Mettre à jour le paiement
                            </a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                            Si vous avez des questions, n'hésitez pas à nous contacter.
                        </p>
                    """
                    text_content = f"""
Échec du paiement

Bonjour {user_name},

Nous n'avons pas pu traiter le paiement de votre facture.

Montant: {amount_due} {currency.upper()}
Tentative: {attempt_count}

Veuillez mettre à jour vos informations de paiement pour éviter l'interruption de service.

{payment_url}

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe MODELE
                    """
                    
                    email_service.send_email(
                        to_email=user.email,
                        subject=subject,
                        html_content=EmailTemplates.get_base_template(html_content),
                        text_content=text_content.strip(),
                    )
                    logger.info(f"Payment failure notification sent to {user.email} for invoice {invoice.id}")
                else:
                    logger.warning("Email service not configured, skipping payment failure notification")
            else:
                logger.warning(f"User {user_id} not found or has no email, skipping payment failure notification")
        except Exception as email_error:
            # Don't fail the webhook if email sending fails
            logger.error(f"Failed to send payment failure notification for invoice {invoice.id}: {email_error}", exc_info=True)
        
    except Exception as e:
        logger.error(f"Error handling invoice.payment_failed event: {e}", exc_info=True)
        raise


async def handle_payment_intent_succeeded(
    event_object: dict,
    db: AsyncSession,
):
    """Handle payment_intent.succeeded event for bookings"""
    payment_intent_id = event_object.get("id")
    if not payment_intent_id:
        logger.warning("payment_intent.succeeded event missing payment intent ID")
        return
    
    try:
        metadata = event_object.get("metadata", {})
        booking_id_str = metadata.get("booking_id")
        booking_reference = metadata.get("booking_reference")
        
        if not booking_id_str and not booking_reference:
            logger.warning(f"PaymentIntent {payment_intent_id} has no booking_id or booking_reference in metadata")
            return
        
        # booking_service = BookingService(db)  # Removed: booking service depends on masterclass models
        
        # Find booking by payment_intent_id or booking_id or booking_reference
        booking = None
        if booking_id_str:
            try:
                booking_id = int(booking_id_str)
                result = await db.execute(
                    select(Booking).where(Booking.id == booking_id)
                )
                booking = result.scalar_one_or_none()
            except (ValueError, TypeError):
                pass
        
        # if not booking and booking_reference:
        #     booking = await booking_service.get_booking_by_reference(booking_reference)  # Removed: booking service depends on masterclass models
        if not booking and booking_reference:
            # Try finding by booking_reference directly
            result = await db.execute(
                select(Booking).where(Booking.booking_reference == booking_reference)
            )
            booking = result.scalar_one_or_none()
        
        if not booking:
            # Try finding by payment_intent_id
            result = await db.execute(
                select(Booking).where(Booking.payment_intent_id == payment_intent_id)
            )
            booking = result.scalar_one_or_none()
        
        if not booking:
            logger.warning(f"Booking not found for PaymentIntent {payment_intent_id}")
            return
        
        # Update booking status
        booking.payment_status = PaymentStatus.PAID
        booking.status = BookingStatus.CONFIRMED
        booking.confirmed_at = datetime.now(timezone.utc)
        
        await db.commit()
        await db.refresh(booking)
        
        logger.info(f"Booking {booking.id} ({booking.booking_reference}) confirmed and marked as paid")
        
        # Send confirmation email
        try:
            email_service = EmailService()
            if email_service.is_configured():
                # Load city_event for email details
                # from app.models.masterclass import CityEvent  # Removed: masterclass models deleted
                # from sqlalchemy.orm import selectinload
                
                # result = await db.execute(
                #     select(CityEvent)
                #     .options(
                #         selectinload(CityEvent.city),
                #         selectinload(CityEvent.venue),
                #         selectinload(CityEvent.event),
                #     )
                #     .where(CityEvent.id == booking.city_event_id)
                # )
                # city_event = result.scalar_one_or_none()
                city_event = None  # Removed: masterclass models deleted
                
                if city_event:
                    # Format dates for email
                    event_date = city_event.start_date.strftime("%d %B %Y")
                    city_name = city_event.city.name_fr or city_event.city.name_en
                    venue_name = city_event.venue.name if city_event.venue else "TBD"
                    
                    # Send booking confirmation email
                    subject = f"Confirmation de réservation - {booking.booking_reference}"
                    html_content = f"""
                        <h2 style="color: #1a3a52; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                            Confirmation de réservation
                        </h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Bonjour {booking.attendee_name},
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Votre réservation pour la masterclass ACT a été confirmée !
                        </p>
                        <div style="background-color: #f0f9ff; border-left: 4px solid #1a3a52; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0; color: #1a3a52; font-size: 16px; font-weight: 600;">
                                Référence: {booking.booking_reference}
                            </p>
                            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                                <strong>Ville:</strong> {city_name}
                            </p>
                            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                                <strong>Date:</strong> {event_date}
                            </p>
                            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                                <strong>Lieu:</strong> {venue_name}
                            </p>
                            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                                <strong>Participants:</strong> {booking.quantity}
                            </p>
                            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
                                <strong>Total payé:</strong> {booking.total} EUR
                            </p>
                        </div>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                            Un email de rappel vous sera envoyé 30 jours avant l'événement avec toutes les informations pratiques.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                            Si vous avez des questions, n'hésitez pas à nous contacter à contact@contextpsy.fr
                        </p>
                    """
                    text_content = f"""
Confirmation de réservation

Bonjour {booking.attendee_name},

Votre réservation pour la masterclass ACT a été confirmée !

Référence: {booking.booking_reference}
Ville: {city_name}
Date: {event_date}
Lieu: {venue_name}
Participants: {booking.quantity}
Total payé: {booking.total} EUR

Un email de rappel vous sera envoyé 30 jours avant l'événement.

Si vous avez des questions, contactez-nous à contact@contextpsy.fr

Cordialement,
L'équipe ContextPsy
                    """
                    
                    email_service.send_email(
                        to_email=booking.attendee_email,
                        subject=subject,
                        html_content=EmailTemplates.get_base_template(html_content),
                        text_content=text_content.strip(),
                    )
                    logger.info(f"Booking confirmation email sent to {booking.attendee_email} for booking {booking.booking_reference}")
            else:
                logger.warning("Email service not configured, skipping booking confirmation email")
        except Exception as email_error:
            logger.error(f"Failed to send booking confirmation email: {email_error}", exc_info=True)
            # Don't fail the webhook if email fails
        
    except Exception as e:
        logger.error(f"Error handling payment_intent.succeeded event: {e}", exc_info=True)
        raise


async def handle_payment_intent_failed(
    event_object: dict,
    db: AsyncSession,
):
    """Handle payment_intent.payment_failed event for bookings"""
    payment_intent_id = event_object.get("id")
    if not payment_intent_id:
        logger.warning("payment_intent.payment_failed event missing payment intent ID")
        return
    
    try:
        metadata = event_object.get("metadata", {})
        booking_id_str = metadata.get("booking_id")
        booking_reference = metadata.get("booking_reference")
        
        if not booking_id_str and not booking_reference:
            logger.warning(f"PaymentIntent {payment_intent_id} has no booking_id or booking_reference in metadata")
            return
        
        # booking_service = BookingService(db)  # Removed: booking service depends on masterclass models
        
        # Find booking
        booking = None
        if booking_id_str:
            try:
                booking_id = int(booking_id_str)
                result = await db.execute(
                    select(Booking).where(Booking.id == booking_id)
                )
                booking = result.scalar_one_or_none()
            except (ValueError, TypeError):
                pass
        
        # if not booking and booking_reference:
        #     booking = await booking_service.get_booking_by_reference(booking_reference)  # Removed: booking service depends on masterclass models
        if not booking and booking_reference:
            # Try finding by booking_reference directly
            result = await db.execute(
                select(Booking).where(Booking.booking_reference == booking_reference)
            )
            booking = result.scalar_one_or_none()
        
        if not booking:
            # Try finding by payment_intent_id
            result = await db.execute(
                select(Booking).where(Booking.payment_intent_id == payment_intent_id)
            )
            booking = result.scalar_one_or_none()
        
        if not booking:
            logger.warning(f"Booking not found for PaymentIntent {payment_intent_id}")
            return
        
        # Update booking status
        booking.payment_status = PaymentStatus.FAILED
        
        await db.commit()
        await db.refresh(booking)
        
        logger.warning(f"Booking {booking.id} ({booking.booking_reference}) payment failed")
        
        # Optionally send failure notification email
        try:
            email_service = EmailService()
            if email_service.is_configured():
                error_message = event_object.get("last_payment_error", {}).get("message", "Paiement échoué")
                
                subject = f"Échec du paiement - Réservation {booking.booking_reference}"
                html_content = f"""
                    <h2 style="color: #dc2626; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                        Échec du paiement
                    </h2>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Bonjour {booking.attendee_name},
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Le paiement de votre réservation a échoué.
                    </p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0; color: #991b1b; font-size: 14px;">
                            <strong>Raison:</strong> {error_message}
                        </p>
                    </div>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                        Veuillez réessayer le paiement ou contacter notre équipe si le problème persiste.
                    </p>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        Contact: contact@contextpsy.fr
                    </p>
                """
                text_content = f"""
Échec du paiement

Bonjour {booking.attendee_name},

Le paiement de votre réservation a échoué.

Raison: {error_message}

Veuillez réessayer le paiement ou contacter notre équipe.

Contact: contact@contextpsy.fr

Cordialement,
L'équipe ContextPsy
                """
                
                email_service.send_email(
                    to_email=booking.attendee_email,
                    subject=subject,
                    html_content=EmailTemplates.get_base_template(html_content),
                    text_content=text_content.strip(),
                )
                logger.info(f"Payment failure notification sent to {booking.attendee_email}")
        except Exception as email_error:
            logger.error(f"Failed to send payment failure notification: {email_error}", exc_info=True)
        
    except Exception as e:
        logger.error(f"Error handling payment_intent.payment_failed event: {e}", exc_info=True)
        raise

