"""
Newsletter Service using SendGrid Marketing Contacts API
Manages newsletter subscriptions and contact lists
"""

import os
from typing import Optional, Dict, Any, List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail.exceptions import SendGridException
from app.core.logging import logger


class NewsletterService:
    """Service for managing newsletter subscriptions via SendGrid"""

    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        if not self.api_key:
            self.client = None
            logger.warning("SENDGRID_API_KEY is not configured. Newsletter service will be disabled.")
        else:
            self.client = SendGridAPIClient(api_key=self.api_key)
        
        # Default list ID from environment
        self.default_list_id = os.getenv("SENDGRID_NEWSLETTER_LIST_ID", "")

    def is_configured(self) -> bool:
        """Check if SendGrid is configured"""
        return self.client is not None

    async def subscribe(
        self,
        email: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        list_ids: Optional[List[str]] = None,
        custom_fields: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Subscribe an email to newsletter list(s)
        
        Args:
            email: Email address to subscribe
            first_name: First name (optional)
            last_name: Last name (optional)
            list_ids: List of SendGrid list IDs (defaults to SENDGRID_NEWSLETTER_LIST_ID)
            custom_fields: Custom fields for the contact
            
        Returns:
            Dict with status and contact_id
        """
        if not self.is_configured():
            raise ValueError("SendGrid is not configured. Please set SENDGRID_API_KEY.")

        try:
            # Use default list if none provided
            if not list_ids:
                if not self.default_list_id:
                    raise ValueError("No list ID provided and SENDGRID_NEWSLETTER_LIST_ID is not set.")
                list_ids = [self.default_list_id]

            # Prepare contact data
            contact_data = {
                "email": email,
                "list_ids": list_ids,
            }

            # Add name if provided
            if first_name or last_name:
                contact_data["first_name"] = first_name or ""
                contact_data["last_name"] = last_name or ""

            # Add custom fields
            if custom_fields:
                contact_data["custom_fields"] = custom_fields

            # Add or update contact
            response = self.client.client.marketing.contacts.put(
                request_body={
                    "contacts": [contact_data]
                }
            )

            if response.status_code in [200, 201, 202]:
                return {
                    "success": True,
                    "email": email,
                    "status_code": response.status_code,
                    "message": "Successfully subscribed to newsletter",
                }
            else:
                logger.error(f"SendGrid API error: {response.status_code} - {response.body}")
                return {
                    "success": False,
                    "error": f"SendGrid API returned status {response.status_code}",
                }

        except SendGridException as e:
            logger.error(f"SendGrid error subscribing {email}: {e}")
            raise RuntimeError(f"Failed to subscribe to newsletter: {e}")

    async def unsubscribe(self, email: str) -> Dict[str, Any]:
        """
        Unsubscribe an email from all lists
        
        Args:
            email: Email address to unsubscribe
            
        Returns:
            Dict with status
        """
        if not self.is_configured():
            raise ValueError("SendGrid is not configured. Please set SENDGRID_API_KEY.")

        try:
            # Delete contact (unsubscribes from all lists)
            response = self.client.client.marketing.contacts.delete(
                query_params={"ids": email}
            )

            if response.status_code in [200, 202, 204]:
                return {
                    "success": True,
                    "email": email,
                    "message": "Successfully unsubscribed from newsletter",
                }
            else:
                return {
                    "success": False,
                    "error": f"SendGrid API returned status {response.status_code}",
                }

        except SendGridException as e:
            logger.error(f"SendGrid error unsubscribing {email}: {e}")
            raise RuntimeError(f"Failed to unsubscribe from newsletter: {e}")

    async def get_contact(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get contact information
        
        Args:
            email: Email address
            
        Returns:
            Contact data or None if not found
        """
        if not self.is_configured():
            return None

        try:
            response = self.client.client.marketing.contacts.get(
                query_params={"emails": email}
            )

            if response.status_code == 200:
                data = response.body
                if data.get("result") and len(data["result"]) > 0:
                    return data["result"][0]
            return None

        except SendGridException as e:
            logger.error(f"SendGrid error getting contact {email}: {e}")
            return None

    async def get_lists(self) -> List[Dict[str, Any]]:
        """
        Get all marketing lists
        
        Returns:
            List of marketing lists
        """
        if not self.is_configured():
            return []

        try:
            response = self.client.client.marketing.lists.get()
            if response.status_code == 200:
                return response.body.get("result", [])
            return []

        except SendGridException as e:
            logger.error(f"SendGrid error getting lists: {e}")
            return []

