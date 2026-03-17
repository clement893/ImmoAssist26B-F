"""
Google Calendar Webhooks
Receive push notifications from Google Calendar API.
TODO: Verify channel token, parse notification, sync Appointment.
"""

from fastapi import APIRouter, Request, status
from app.core.logging import logger

router = APIRouter(prefix="/webhooks/google/calendar", tags=["webhooks-calendar"])


@router.post("", status_code=status.HTTP_200_OK)
async def google_calendar_webhook(request: Request):
    """
    Receive Google Calendar push notification.
    TODO: Verify X-Goog-Channel-ID, X-Goog-Resource-State; load CalendarConnection by channel;
    fetch changed event from Google API; create/update/delete Appointment.
    """
    body = await request.body()
    headers = dict(request.headers)
    logger.info("Google Calendar webhook received", extra={"headers_keys": list(headers.keys()), "body_len": len(body)})
    return {"status": "ok"}
