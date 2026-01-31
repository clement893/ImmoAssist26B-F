"""Authentication endpoints."""

import os
import logging
from datetime import timedelta
from urllib.parse import urlencode, urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.httpx_client import AsyncOAuth2Client
import httpx

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse, RefreshTokenRequest
from app.services.user_service import UserService
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def validate_url(url: str, field_name: str = "URL") -> str:
    """
    Validate that a URL is properly formed with scheme and netloc
    
    Args:
        url: URL string to validate
        field_name: Name of the field for error messages
    
    Returns:
        Validated URL string
    
    Raises:
        HTTPException: If URL is invalid
    """
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} is required and cannot be empty"
        )
    
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {field_name}: URL must include scheme (http/https) and domain. Got: {url}"
            )
        return url
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format: {str(e)}"
        )


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user."""
    service = UserService(db)

    try:
        user = await service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Login user."""
    service = UserService(db)

    user = await service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token."""
    # Decode refresh token
    payload = decode_token(refresh_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    # Verify token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    # Fetch user from database
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Create new access token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    
    # Create new refresh token
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user,
    )


@router.get("/google")
async def google_auth(request: Request):
    """Initiate Google OAuth flow."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Please contact the administrator.",
        )
    
    # Build redirect URI - use the configured one or construct from request
    callback_uri = GOOGLE_REDIRECT_URI
    if not callback_uri:
        # Use BASE_URL from settings if available, otherwise construct from request
        if settings.BASE_URL:
            backend_base_url = settings.BASE_URL.rstrip("/")
        else:
            try:
                backend_base_url = str(request.base_url).rstrip("/")
            except Exception as e:
                # Fallback to BASE_URL from settings or environment variable
                backend_base_url = os.getenv("BASE_URL", "http://localhost:8000")
        callback_uri = f"{backend_base_url}/api/auth/google/callback"
    
    # Ensure callback_uri doesn't have trailing slash (Google is strict about exact match)
    callback_uri = callback_uri.rstrip("/")
    
    # Validate callback_uri before use
    try:
        callback_uri = validate_url(callback_uri, "callback_uri")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Invalid callback URI configuration: {str(e)}. Please check BASE_URL or GOOGLE_REDIRECT_URI environment variables."
        )
    
    # Google OAuth endpoints
    authorization_endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
    
    # Build authorization URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": callback_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    auth_url = f"{authorization_endpoint}?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured",
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided",
        )
    
    # Build redirect URI - must match EXACTLY the one used in /google endpoint
    callback_uri = GOOGLE_REDIRECT_URI
    if not callback_uri:
        # Use BASE_URL from settings if available, otherwise construct from request
        if settings.BASE_URL:
            backend_base_url = settings.BASE_URL.rstrip("/")
        else:
            try:
                backend_base_url = str(request.base_url).rstrip("/")
            except Exception as e:
                # Fallback to BASE_URL from settings or environment variable
                backend_base_url = os.getenv("BASE_URL", "http://localhost:8000")
        callback_uri = f"{backend_base_url}/api/auth/google/callback"
    
    # Ensure callback_uri doesn't have trailing slash (Google is strict about exact match)
    callback_uri = callback_uri.rstrip("/")
    
    # Validate callback_uri before use
    try:
        callback_uri = validate_url(callback_uri, "callback_uri")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Invalid callback URI configuration: {str(e)}. Please check BASE_URL or GOOGLE_REDIRECT_URI environment variables."
        )
    
    try:
        # Exchange code for token
        # AsyncOAuth2Client uses httpx internally, configure with better timeout settings
        async with AsyncOAuth2Client(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            timeout=httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=5.0),
        ) as client:
            token_endpoint = "https://oauth2.googleapis.com/token"
            token_response = await client.fetch_token(
                token_endpoint,
                code=code,
                redirect_uri=callback_uri,
            )
            
            access_token = token_response.get("access_token")
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get access token from Google",
                )
            
            # Get user info from Google
            userinfo_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
            userinfo_response = await client.get(
                userinfo_endpoint,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            userinfo = userinfo_response.json()
            
            email = userinfo.get("email")
            name = userinfo.get("name", email.split("@")[0] if email else "")
            google_id = userinfo.get("id")
            
            if not email or not google_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google",
                )
            
            # Get or create user
            service = UserService(db)
            user = await service.get_or_create_oauth_user(
                email=email,
                name=name,
                provider="google",
                provider_id=google_id,
            )
            
            # Create JWT tokens
            access_token_jwt = create_access_token(
                data={"sub": str(user.id)},
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            
            refresh_token_jwt = create_refresh_token(
                data={"sub": str(user.id)},
            )
            
            # Redirect to frontend with tokens
            params = {
                "access_token": access_token_jwt,
                "refresh_token": refresh_token_jwt,
                "token_type": "bearer",
            }
            
            redirect_url = f"{FRONTEND_URL}/auth/callback?{urlencode(params)}"
            return RedirectResponse(url=redirect_url)
            
    except httpx.ConnectError as e:
        # DNS resolution errors and connection errors
        error_str = str(e)
        if "Name or service not known" in error_str or "DNS" in error_str.upper() or "[Errno -2]" in error_str:
            logger.error(f"DNS resolution error in Google OAuth: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "DNS resolution failed when connecting to Google OAuth services. "
                    "Please check: 1) Backend server has internet connectivity, "
                    "2) DNS settings are properly configured, "
                    "3) No firewall blocking access to Google's servers (oauth2.googleapis.com, www.googleapis.com). "
                    f"Error details: {error_str}"
                )
            )
        else:
            logger.error(f"Connection error in Google OAuth: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Google OAuth services. Please check network connectivity and firewall settings. Error: {error_str}"
            )
    except httpx.TimeoutException as e:
        logger.error(f"Timeout error in Google OAuth: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Request to Google OAuth services timed out. Please try again later. Error: {str(e)}"
        )
    except httpx.NetworkError as e:
        logger.error(f"Network error in Google OAuth: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Network error occurred while communicating with Google OAuth services. Please check network configuration. Error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        # Check if it's a DNS error that wasn't caught by httpx exceptions
        if "Name or service not known" in error_str or "[Errno -2]" in error_str:
            logger.error(f"DNS resolution error in Google OAuth (caught in generic handler): {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "DNS resolution failed when connecting to Google OAuth services. "
                    "Please check: 1) Backend server has internet connectivity, "
                    "2) DNS settings are properly configured, "
                    "3) No firewall blocking access to Google's servers (oauth2.googleapis.com, www.googleapis.com). "
                    "4) BASE_URL or GOOGLE_REDIRECT_URI environment variables are set correctly. "
                    f"Error details: {error_str}"
                )
            )
        logger.error(f"Google OAuth callback error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth error: {error_str}",
        )
