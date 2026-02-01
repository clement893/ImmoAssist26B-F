"""
Microsoft Calendar Webhooks
Receive notifications from Microsoft Graph (subscriptions).
TODO: Validate validationToken, parse resource data; sync Appointment.
"""

from fastapi import APIRouter, Request, Query, status
from app.core.logging import logger

router = APIRouter(prefix="/webhooks/microsoft/calendar", tags=["webhooks-calendar"])


@router.get("", status_code=status.HTTP_200_OK)
async def microsoft_calendar_webhook_validation(
    request: Request,
    validationToken: str | None = Query(None, alias="validationToken"),
):
    """Microsoft sends GET with validationToken to confirm subscription. Return token as plain text."""
    if validationToken:
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=validationToken)
    return {"status": "ok"}


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def microsoft_calendar_webhook(request: Request):
    """
    Receive Microsoft Graph subscription notification.
    TODO: Parse value[].resource, fetch event from Graph; create/update/delete Appointment.
    """
    body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    logger.info("Microsoft Calendar webhook received", extra={"body_keys": list(body.keys()) if isinstance(body, dict) else []})
    return {"status": "accepted"}
