"""
Email Tasks for Celery Background Processing

This module contains Celery tasks for sending transactional emails via SendGrid.
All tasks are designed to run asynchronously in the background to avoid blocking
API requests.

Tasks include automatic retry with exponential backoff on failure.

Usage:
    from app.tasks.email_tasks import send_welcome_email_task
    
    # Send email asynchronously (recommended)
    task = send_welcome_email_task.delay("user@example.com", "John Doe")
    
    # Send email synchronously (for testing)
    result = send_welcome_email_task("user@example.com", "John Doe")

Available Tasks:
    - send_email_task: Generic email sending task
    - send_welcome_email_task: Welcome email for new users
    - send_password_reset_email_task: Password reset email
    - send_verification_email_task: Email verification
    - send_invoice_email_task: Invoice email
    - send_subscription_created_email_task: Subscription confirmation
    - send_subscription_cancelled_email_task: Subscription cancellation
    - send_trial_ending_email_task: Trial ending reminder
"""

from app.celery_app import celery_app
from app.services.email_service import EmailService
from app.core.logging import logger


@celery_app.task(bind=True, max_retries=3)
def send_email_task(self, to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send email task using SendGrid."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            logger.warning(
                "SendGrid not configured. Email sending skipped",
                context={"to_email": to_email, "subject": subject}
            )
            return {"status": "skipped", "to": to_email, "reason": "SendGrid not configured"}
        
        # SendGrid is synchronous, so we can call it directly
        result = email_service.send_email(to_email, subject, html_content, text_content)
        return result
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_welcome_email_task(self, email: str, name: str, login_url: str = None):
    """Send welcome email task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_welcome_email(email, name, login_url)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_password_reset_email_task(self, email: str, name: str, reset_token: str, reset_url: str = None):
    """Send password reset email task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_password_reset_email(email, name, reset_token, reset_url)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_verification_email_task(self, email: str, name: str, verification_token: str, verification_url: str = None):
    """Send email verification task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_verification_email(email, name, verification_token, verification_url)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_invoice_email_task(
    self,
    email: str,
    name: str,
    invoice_number: str,
    invoice_date: str,
    amount: float,
    currency: str = "EUR",
    invoice_url: str = None,
    items: list = None,
):
    """Send invoice email task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_invoice_email(
            email, name, invoice_number, invoice_date, amount, currency, invoice_url, items
        )
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_subscription_created_email_task(self, email: str, name: str, plan_name: str, amount: float, currency: str = "EUR"):
    """Send subscription created email task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_subscription_created_email(email, name, plan_name, amount, currency)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_subscription_cancelled_email_task(self, email: str, name: str, plan_name: str, end_date: str):
    """Send subscription cancelled email task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_subscription_cancelled_email(email, name, plan_name, end_date)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_trial_ending_email_task(self, email: str, name: str, days_remaining: int, upgrade_url: str = None):
    """Send trial ending soon email task."""
    try:
        email_service = EmailService()
        if not email_service.is_configured():
            return {"status": "skipped", "to": email, "reason": "SendGrid not configured"}
        
        result = email_service.send_trial_ending_email(email, name, days_remaining, upgrade_url)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
