"""Email service using SendGrid."""

import os
from typing import List, Optional, Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from sendgrid.helpers.mail.exceptions import SendGridException
from app.services.email_templates import EmailTemplates
from app.core.logging import logger


class EmailService:
    """Service for sending emails via SendGrid."""

    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL", os.getenv("FROM_EMAIL", "noreply@example.com"))
        self.from_name = os.getenv("SENDGRID_FROM_NAME", os.getenv("FROM_NAME", "MODELE"))

        if not self.api_key:
            self.client = None
            logger.warning("SENDGRID_API_KEY is not configured. Email sending will be disabled.")
        else:
            self.client = SendGridAPIClient(api_key=self.api_key)

    def is_configured(self) -> bool:
        """Check if SendGrid is configured."""
        return self.client is not None

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Send an email via SendGrid.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional, auto-generated from HTML if not provided)
            from_email: Sender email (defaults to SENDGRID_FROM_EMAIL)
            from_name: Sender name (defaults to SENDGRID_FROM_NAME)
            reply_to: Reply-to email address
            cc: List of CC email addresses
            bcc: List of BCC email addresses

        Returns:
            Dict with status and message_id

        Raises:
            ValueError: If SendGrid is not configured
            RuntimeError: If email sending fails
        """
        if not self.is_configured():
            raise ValueError("SendGrid service is not configured. Please set SENDGRID_API_KEY.")

        from_email = from_email or self.from_email
        from_name = from_name or self.from_name

        # Create email message
        message = Mail(
            from_email=Email(from_email, from_name),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content),
        )

        # Add text content if provided
        if text_content:
            message.plain_text_content = Content("text/plain", text_content)

        # Add reply-to if provided
        if reply_to:
            message.reply_to = Email(reply_to)

        # Add CC if provided
        if cc:
            message.cc = [To(email) for email in cc]

        # Add BCC if provided
        if bcc:
            message.bcc = [To(email) for email in bcc]

        try:
            response = self.client.send(message)
            
            # Check if response is successful (2xx status codes)
            if response.status_code >= 200 and response.status_code < 300:
                return {
                    "status": "sent",
                    "status_code": response.status_code,
                    "message_id": response.headers.get("X-Message-Id"),
                    "to": to_email,
                }
            else:
                # SendGrid returned an error status code
                error_body = getattr(response, 'body', 'Unknown error')
                raise RuntimeError(f"SendGrid API returned status {response.status_code}: {error_body}")
        except SendGridException as e:
            raise RuntimeError(f"Failed to send email via SendGrid: {str(e)}")
        except Exception as e:
            # Catch any other unexpected exceptions
            raise RuntimeError(f"Unexpected error sending email: {str(e)}")

    def send_welcome_email(self, to_email: str, name: str, login_url: Optional[str] = None) -> Dict[str, Any]:
        """Send a welcome email to a new user."""
        template = EmailTemplates.welcome(name, login_url)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

    def send_password_reset_email(
        self, to_email: str, name: str, reset_token: str, reset_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a password reset email."""
        template = EmailTemplates.password_reset(name, reset_token, reset_url)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

    def send_verification_email(
        self, to_email: str, name: str, verification_token: str, verification_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an email verification email."""
        template = EmailTemplates.email_verification(name, verification_token, verification_url)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

    def send_invoice_email(
        self,
        to_email: str,
        name: str,
        invoice_number: str,
        invoice_date: str,
        amount: float,
        currency: str = "EUR",
        invoice_url: Optional[str] = None,
        items: Optional[list] = None,
    ) -> Dict[str, Any]:
        """Send an invoice email."""
        template = EmailTemplates.invoice(name, invoice_number, invoice_date, amount, currency, invoice_url, items)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

    def send_subscription_created_email(
        self, to_email: str, name: str, plan_name: str, amount: float, currency: str = "EUR"
    ) -> Dict[str, Any]:
        """Send subscription created email."""
        template = EmailTemplates.subscription_created(name, plan_name, amount, currency)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

    def send_subscription_cancelled_email(
        self, to_email: str, name: str, plan_name: str, end_date: str
    ) -> Dict[str, Any]:
        """Send subscription cancelled email."""
        template = EmailTemplates.subscription_cancelled(name, plan_name, end_date)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

    def send_trial_ending_email(
        self, to_email: str, name: str, days_remaining: int, upgrade_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send trial ending soon email."""
        template = EmailTemplates.trial_ending(name, days_remaining, upgrade_url)
        return self.send_email(
            to_email=to_email,
            subject=template["subject"],
            html_content=template["html"],
            text_content=template["text"],
        )

