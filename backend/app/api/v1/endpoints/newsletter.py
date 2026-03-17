"""
Newsletter API Endpoints
Manage newsletter subscriptions using SendGrid Marketing Contacts
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.services.newsletter_service import NewsletterService
from app.core.logging import logger

router = APIRouter()


class NewsletterSubscribeRequest(BaseModel):
    """Newsletter subscription request"""
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    list_ids: Optional[list[str]] = None
    source: Optional[str] = Field(None, description="Source of subscription (e.g., 'homepage', 'footer')")


class NewsletterUnsubscribeRequest(BaseModel):
    """Newsletter unsubscribe request"""
    email: EmailStr


@router.post("/subscribe", status_code=status.HTTP_200_OK, tags=["newsletter"])
async def subscribe_to_newsletter(
    request: NewsletterSubscribeRequest,
):
    """
    Subscribe an email to the newsletter.
    Public endpoint - no authentication required.
    """
    try:
        service = NewsletterService()
        
        if not service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Newsletter service is not configured. Please set SENDGRID_API_KEY and SENDGRID_NEWSLETTER_LIST_ID.",
            )

        # Prepare custom fields
        custom_fields = {}
        if request.source:
            custom_fields["source"] = request.source

        result = await service.subscribe(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            list_ids=request.list_ids,
            custom_fields=custom_fields if custom_fields else None,
        )

        if result.get("success"):
            logger.info(f"Newsletter subscription: {request.email}")
            return {
                "success": True,
                "message": "Successfully subscribed to newsletter",
                "email": request.email,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to subscribe to newsletter"),
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Newsletter subscription error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to subscribe to newsletter: {str(e)}",
        )


@router.post("/unsubscribe", status_code=status.HTTP_200_OK, tags=["newsletter"])
async def unsubscribe_from_newsletter(
    request: NewsletterUnsubscribeRequest,
):
    """
    Unsubscribe an email from the newsletter.
    Public endpoint - no authentication required.
    """
    try:
        service = NewsletterService()
        
        if not service.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Newsletter service is not configured.",
            )

        result = await service.unsubscribe(email=request.email)

        if result.get("success"):
            logger.info(f"Newsletter unsubscription: {request.email}")
            return {
                "success": True,
                "message": "Successfully unsubscribed from newsletter",
                "email": request.email,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to unsubscribe from newsletter"),
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Newsletter unsubscription error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unsubscribe from newsletter: {str(e)}",
        )


@router.get("/status/{email}", tags=["newsletter"])
async def get_subscription_status(
    email: str,
):
    """
    Get newsletter subscription status for an email.
    Public endpoint - no authentication required.
    """
    try:
        service = NewsletterService()
        
        if not service.is_configured():
            return {
                "subscribed": False,
                "configured": False,
            }

        contact = await service.get_contact(email)
        
        return {
            "subscribed": contact is not None,
            "email": email,
            "contact": contact,
        }

    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        return {
            "subscribed": False,
            "email": email,
            "error": str(e),
        }

