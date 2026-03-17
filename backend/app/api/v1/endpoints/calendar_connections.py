"""
Calendar Connections Endpoints
OAuth2 and management for Google Calendar / Outlook
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.calendar_connection import CalendarConnection, CalendarProvider
from app.schemas.calendar_connection import CalendarConnectionResponse, CalendarConnectionListResponse

router = APIRouter(prefix="/calendar/connections", tags=["calendar-connections"])


@router.get("/", response_model=CalendarConnectionListResponse)
async def list_connections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List calendar connections for the current user (no tokens returned)."""
    result = await db.execute(
        select(CalendarConnection).where(CalendarConnection.user_id == current_user.id)
    )
    connections = result.scalars().all()
    return CalendarConnectionListResponse(
        connections=[CalendarConnectionResponse.model_validate(c) for c in connections]
    )


@router.get("/oauth/google")
async def oauth_google_start(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Initiate Google OAuth2 flow.
    Redirects user to Google consent screen.
    TODO: Implement with google-auth-oauthlib and env GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirect_uri.
    """
    # Stub: return URL to frontend so it can redirect
    base_url = str(request.base_url).rstrip("/")
    callback_url = f"{base_url}/api/v1/calendar/connections/oauth/google/callback"
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "message": "Google OAuth not configured. Set GOOGLE_CLIENT_ID and redirect_uri.",
            "callback_url": callback_url,
        },
    )


@router.get("/oauth/google/callback")
async def oauth_google_callback(
    request: Request,
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Callback for Google OAuth2. Exchange code for tokens and store CalendarConnection."""
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code")
    # TODO: Exchange code for access_token/refresh_token, store in CalendarConnection
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth callback not implemented")


@router.get("/oauth/outlook")
async def oauth_outlook_start(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Initiate Microsoft OAuth2 flow.
    TODO: Implement with msal and env MICROSOFT_CLIENT_ID, redirect_uri.
    """
    base_url = str(request.base_url).rstrip("/")
    callback_url = f"{base_url}/api/v1/calendar/connections/oauth/outlook/callback"
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "message": "Outlook OAuth not configured.",
            "callback_url": callback_url,
        },
    )


@router.get("/oauth/outlook/callback")
async def oauth_outlook_callback(
    request: Request,
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Callback for Microsoft OAuth2."""
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code")
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Outlook OAuth callback not implemented")


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_calendar(
    provider: Optional[CalendarProvider] = Query(None, description="If set, disconnect only this provider; otherwise disconnect all"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove calendar connection(s) for the current user."""
    query = select(CalendarConnection).where(CalendarConnection.user_id == current_user.id)
    if provider is not None:
        query = query.where(CalendarConnection.provider == provider)
    result = await db.execute(query)
    connections = result.scalars().all()
    for c in connections:
        await db.delete(c)
    await db.commit()
    return None
