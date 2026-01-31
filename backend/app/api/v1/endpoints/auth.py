"""
Authentication Endpoints
"""

import asyncio
import base64
import json
from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlencode, urlparse

import httpx
import bcrypt
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db, AsyncSessionLocal
from app.core.rate_limit import rate_limit_decorator
from app.core.logging import logger
from app.core.security import create_refresh_token
from app.core.security_audit import SecurityAuditLogger, SecurityEventType
from app.models.user import User
from app.schemas.auth import Token, TokenData, UserCreate, UserResponse, RefreshTokenRequest, TokenWithUser
from pydantic import BaseModel, EmailStr

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Try bcrypt directly first (for new hashes), fallback to passlib for compatibility
    try:
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            # Remove incomplete UTF-8 sequences
            while len(password_bytes) > 0:
                try:
                    password_bytes.decode('utf-8')
                    break
                except UnicodeDecodeError:
                    password_bytes = password_bytes[:-1]
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        # Fallback to passlib for old hashes
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly (bypassing passlib to avoid 72-byte limit issues)"""
    # Bcrypt has a 72-byte limit, so truncate password to 72 bytes if needed
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        # Truncate to 72 bytes, ensuring we don't break UTF-8 characters
        password_bytes = password_bytes[:72]
        # Remove any incomplete UTF-8 sequences at the end
        while len(password_bytes) > 0:
            try:
                password_bytes.decode('utf-8')
                break
            except UnicodeDecodeError:
                password_bytes = password_bytes[:-1]
        # Use the truncated bytes directly
        password_bytes = password_bytes
    else:
        password_bytes = password.encode('utf-8')
    
    # Use bcrypt directly instead of passlib to avoid compatibility issues
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Handle case where token might be None (shouldn't happen with oauth2_scheme, but be safe)
    if not token:
        raise credentials_exception
    
    try:
        # SECURITY: Do not log token content to prevent information disclosure
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Verify token type
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning("Invalid token type, expected 'access'")
            # Log invalid token event
            try:
                await SecurityAuditLogger.log_event(
                    db=db,
                    event_type=SecurityEventType.INVALID_TOKEN,
                    description="Invalid token type in authentication attempt",
                    severity="warning",
                    success="failure",
                    metadata={"token_type": token_type, "expected": "access"}
                )
            except Exception:
                pass  # Don't fail auth if audit logging fails
            raise credentials_exception
        username: str = payload.get("sub")
        if username is None:
            logger.warning("No 'sub' claim in token payload")
            # Log invalid token event
            try:
                await SecurityAuditLogger.log_event(
                    db=db,
                    event_type=SecurityEventType.INVALID_TOKEN,
                    description="Token missing 'sub' claim",
                    severity="warning",
                    success="failure",
                    metadata={"reason": "missing_sub_claim"}
                )
            except Exception:
                pass  # Don't fail auth if audit logging fails
            raise credentials_exception
        token_data = TokenData(username=username)
        # SECURITY: Only log username (email), not token or payload
        logger.debug(f"Token validated for user: {username}")
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        # Log invalid token event
        try:
            await SecurityAuditLogger.log_event(
                db=db,
                event_type=SecurityEventType.INVALID_TOKEN,
                description=f"JWT decode error: {str(e)}",
                severity="warning",
                success="failure",
                metadata={"error_type": type(e).__name__}
            )
        except Exception:
            pass  # Don't fail auth if audit logging fails
        raise credentials_exception

    # Get user from database
    try:
        result = await db.execute(
            select(User).where(User.email == token_data.username)
        )
        user = result.scalar_one_or_none()
        if user is None:
            logger.warning("User not found in database for authenticated token")
            raise credentials_exception
        # SECURITY: Only log user ID, not email or other sensitive data
        logger.debug(f"User authenticated: id={user.id}")
        return user
    except (ConnectionError, TimeoutError) as e:
        logger.error(f"Database connection error in get_current_user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Keep generic Exception as last resort, but log with context
        logger.error(f"Database error in get_current_user: {e}", exc_info=True)
        raise credentials_exception


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_decorator("3/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    response: Response,
) -> UserResponse:
    """
    Register a new user
    
    Args:
        user_data: User registration data
        db: Database session
        response: FastAPI response object (for rate limit headers)
        
    Returns:
        Created user
    """
    # Log registration attempt
    logger.info(f"Registration attempt for email: {user_data.email}")
    
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    if existing_user:
        logger.warning(f"Registration failed: Email already registered - {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Convert to response model - convert datetime to ISO string format
    user_dict = {
        "id": new_user.id,
        "email": new_user.email,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at.isoformat() if new_user.created_at else "",
        "updated_at": new_user.updated_at.isoformat() if new_user.updated_at else "",
    }
    user_response = UserResponse.model_validate(user_dict)
    return user_response


class LoginRequest(BaseModel):
    """Login request schema for JSON body"""
    email: EmailStr
    password: str


@router.post("/login", response_model=TokenWithUser)
@rate_limit_decorator("5/minute")
async def login(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenWithUser:
    """
    Login endpoint - accepts both form-data (OAuth2) and JSON
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        TokenWithUser: Access token and user data
    """
    # Determine if request is JSON or form-data
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        # JSON request - parse body manually
        try:
            body = await request.json()
            login_data = LoginRequest(**body)
            email = login_data.email
            password = login_data.password
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid JSON data: {str(e)}",
            )
    else:
        # Form-data request (OAuth2 standard) - parse form manually
        try:
            form = await request.form()
            email = form.get("username")  # OAuth2 uses 'username' field for email
            password = form.get("password")
            if not email or not password:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Form data required with 'username' and 'password' fields",
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid form data: {str(e)}",
            )
    
    # Normalize email (lowercase and trim) for consistent lookup
    normalized_email = email.strip().lower() if email else None
    if not normalized_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email is required",
        )
    
    # Get user from database
    result = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = result.scalar_one_or_none()

    # Get client IP and user agent for audit logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    if not user or not verify_password(password, user.hashed_password):
        # Log failed login attempt
        # Use separate session (db=None) to ensure log is saved even if exception is raised
        logger.info(f"Login failure detected for email: {email}")
        try:
            audit_log = await SecurityAuditLogger.log_authentication_event(
                db=None,  # Create separate session to ensure persistence
                event_type=SecurityEventType.LOGIN_FAILURE,
                description=f"Failed login attempt for email: {normalized_email}",
                user_email=normalized_email if user else None,
                user_id=user.id if user else None,
                ip_address=client_ip,
                user_agent=user_agent,
                request_method=request.method,
                request_path=str(request.url.path),
                success="failure",
                metadata={"reason": "invalid_credentials"}
            )
            if audit_log:
                logger.info(f"✅ Login failure audit log created successfully (ID: {audit_log.id})")
            else:
                logger.error("❌ Login failure audit log returned None - logging may have failed silently")
        except Exception as e:
            # Don't fail the request if audit logging fails, but log prominently
            error_msg = (
                f"❌ FAILED TO LOG LOGIN FAILURE EVENT: {e}\n"
                f"   Email: {normalized_email}\n"
                f"   IP: {client_ip}\n"
                f"   Error Type: {type(e).__name__}\n"
                f"   Error Details: {str(e)}"
            )
            logger.error(error_msg, exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user account is active
    if not user.is_active:
        # Log failed login attempt (account disabled)
        # Use separate session (db=None) to ensure log is saved even if exception is raised
        try:
            await SecurityAuditLogger.log_authentication_event(
                db=None,  # Create separate session to ensure persistence
                event_type=SecurityEventType.LOGIN_FAILURE,
                description=f"Login attempt for disabled account: {user.email}",
                user_email=user.email,
                user_id=user.id,
                ip_address=client_ip,
                user_agent=user_agent,
                request_method=request.method,
                request_path=str(request.url.path),
                success="failure",
                metadata={"reason": "account_disabled"}
            )
        except Exception as e:
            logger.error(f"Failed to log disabled account login attempt: {e}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled. Please contact support.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "type": "access"},
        expires_delta=access_token_expires,
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": user.email, "user_id": user.id, "type": "refresh"}
    )

    # Log successful login
    # Note: log_authentication_event() commits internally, so we don't need to commit again
    try:
        await SecurityAuditLogger.log_authentication_event(
            db=db,
            event_type=SecurityEventType.LOGIN_SUCCESS,
            description=f"User logged in successfully: {user.email}",
            user_id=user.id,
            user_email=user.email,
            ip_address=client_ip,
            user_agent=user_agent,
            request_method=request.method,
            request_path=str(request.url.path),
            success="success",
            metadata={"login_method": "password"}
        )
    except Exception as e:
        # Don't fail the request if audit logging fails, but log the error prominently
        error_msg = (
            f"⚠️ SECURITY AUDIT LOGGING FAILED FOR LOGIN: {e}\n"
            f"   User: {user.email} (ID: {user.id})\n"
            f"   IP: {client_ip}\n"
            f"   This is a critical issue - audit logs are not being saved!"
        )
        logger.error(error_msg, exc_info=True)
        # Try to rollback any partial transaction
        try:
            await db.rollback()
        except Exception:
            pass

    # Convert user to UserResponse format
    # Use direct constructor for consistency with get_current_user_info endpoint
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        theme_preference=user.theme_preference or 'system',  # Required field for API compatibility
        created_at=user.created_at.isoformat() if user.created_at else "",
        updated_at=user.updated_at.isoformat() if user.updated_at else "",
    )
    
    # Return JSONResponse explicitly to work with rate limiting middleware
    token_data = TokenWithUser(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        user=user_response
    )
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=token_data.model_dump()
    )


@router.post("/refresh", response_model=Token)
@rate_limit_decorator("10/minute")  # Rate limit: 10 requests per minute
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Token:
    """
    Refresh access token
    
    Accepts either:
    - An expired access token (if still valid for refresh)
    - A refresh token (if refresh tokens are implemented)
    
    Args:
        refresh_data: Request with either "token" (expired access token) or "refresh_token"
        db: Database session
        
    Returns:
        New access token
    """
    # Try to get token from refresh_data
    token = refresh_data.token or refresh_data.refresh_token
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token or refresh_token is required",
        )
    
    try:
        # Try to decode the token (even if expired, we can still read the payload)
        # Use verify_exp=False to read expired tokens
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_exp": False})
        
        # Verify token type
        token_type = payload.get("type", "access")
        if token_type not in ("access", "refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user email from token
        username = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify user still exists and is active
        result = await db.execute(
            select(User).where(User.email == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not active",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "type": "access"},
            expires_delta=access_token_expires,
        )
        
        logger.info(f"Token refreshed for user {user.email}")
        
        # Return JSONResponse explicitly to work with rate limiting middleware
        token_data = Token(access_token=access_token, token_type="bearer")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=token_data.model_dump()
        )
        
    except jwt.ExpiredSignatureError:
        # Token is expired, but we can still refresh it if user exists
        # This allows refreshing expired tokens
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_exp": False})
            username = payload.get("sub")
            if username:
                result = await db.execute(
                    select(User).where(User.email == username)
                )
                user = result.scalar_one_or_none()
                if user and user.is_active:
                    # Create new access token
                    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
                    access_token = create_access_token(
                        data={"sub": user.email, "type": "access"},
                        expires_delta=access_token_expires,
                    )
                    logger.info(f"Expired token refreshed for user {user.email}")
                    # Return JSONResponse explicitly to work with rate limiting middleware
                    token_data = Token(access_token=access_token, token_type="bearer")
                    return JSONResponse(
                        status_code=status.HTTP_200_OK,
                        content=token_data.model_dump()
                    )
        except Exception:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired and cannot be refreshed",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e:
        logger.warning(f"JWT error during refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """
    Logout endpoint
    
    Logs the logout event in the audit trail.
    Note: Token invalidation is handled client-side by removing the token.
    
    Args:
        request: FastAPI request object
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Success message
    """
    # Get client IP and user agent for audit logging
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Log logout event
    # Use separate session (db=None) to ensure log is saved independently
    logger.info(f"Logout endpoint called for user {current_user.email} (ID: {current_user.id})")
    try:
        audit_log = await SecurityAuditLogger.log_authentication_event(
            db=None,  # Create separate session to ensure persistence
            event_type=SecurityEventType.LOGOUT,
            description=f"User logged out: {current_user.email}",
            user_id=current_user.id,
            user_email=current_user.email,
            ip_address=client_ip,
            user_agent=user_agent,
            request_method=request.method,
            request_path=str(request.url.path),
            success="success"
        )
        if audit_log:
            logger.info(f"✅ Logout audit log created successfully (ID: {audit_log.id})")
        else:
            logger.error("❌ Logout audit log returned None - logging may have failed silently")
    except Exception as e:
        # Don't fail the request if audit logging fails, but log prominently
        error_msg = (
            f"❌ FAILED TO LOG LOGOUT EVENT: {e}\n"
            f"   User: {current_user.email} (ID: {current_user.id})\n"
            f"   IP: {client_ip}\n"
            f"   Error Type: {type(e).__name__}\n"
            f"   Error Details: {str(e)}"
        )
        logger.error(error_msg, exc_info=True)
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """
    Get current user information
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User information
    """
    try:
        logger.info(f"Getting user info for: {current_user.email}")
        # Convert User model to UserResponse schema
        # This ensures relations are not loaded unnecessarily
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            is_active=current_user.is_active,
            # theme_preference is deprecated but kept for API compatibility
            theme_preference=current_user.theme_preference or 'system',
            created_at=current_user.created_at.isoformat() if current_user.created_at else "",
            updated_at=current_user.updated_at.isoformat() if current_user.updated_at else "",
        )
    except Exception as e:
        logger.error(f"Error in get_current_user_info: {e}", exc_info=True)
        raise


@router.get("/google", response_model=dict)
async def get_google_auth_url(
    request: Request,
    redirect: Annotated[str | None, Query(description="Frontend redirect URL after authentication")] = None,
):
    """
    Get Google OAuth authorization URL
    
    Args:
        request: FastAPI request object
        redirect: Optional frontend URL to redirect to after authentication
    
    Returns:
        Authorization URL for Google OAuth
    """
    try:
        logger.info(f"Google OAuth request received, redirect: {redirect}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Request URL: {request.url}")
        
        if not settings.GOOGLE_CLIENT_ID:
            logger.warning("Google OAuth not configured: GOOGLE_CLIENT_ID missing")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        # Build redirect URI - use the configured one or construct from request
        callback_uri = settings.GOOGLE_REDIRECT_URI
        # Clean up the URI: remove quotes, whitespace, and trailing slashes
        if callback_uri:
            callback_uri = callback_uri.strip().strip('"').strip("'").rstrip("/")
        if not callback_uri:
            # Use BASE_URL from settings if available, otherwise construct from request
            if settings.BASE_URL:
                backend_base_url = settings.BASE_URL.rstrip("/")
                logger.info(f"Using BASE_URL from settings: {backend_base_url}")
            else:
                try:
                    backend_base_url = str(request.base_url).rstrip("/")
                    # Validate the URL is properly formed
                    parsed = urlparse(backend_base_url)
                    if not parsed.scheme or not parsed.netloc:
                        raise ValueError("Invalid base_url from request")
                    logger.info(f"Using request.base_url: {backend_base_url}")
                except Exception as e:
                    logger.error(f"Error getting base_url from request: {e}")
                    # Fallback to BASE_URL from settings or environment variable
                    import os
                    backend_base_url = os.getenv("BASE_URL", "http://localhost:8000")
                    logger.warning(f"Using fallback base_url from environment: {backend_base_url}")
            callback_uri = f"{backend_base_url}{settings.API_V1_STR}/auth/google/callback"
        
        # Ensure callback_uri doesn't have trailing slash (Google is strict about exact match)
        callback_uri = callback_uri.rstrip("/")
        
        # Validate callback_uri is a valid URL
        try:
            parsed_callback = urlparse(callback_uri)
            if not parsed_callback.scheme or not parsed_callback.netloc:
                raise ValueError(f"Invalid callback_uri format: {callback_uri}")
        except Exception as e:
            logger.error(f"Invalid callback_uri: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid redirect URI configuration: {str(e)}. Please set BASE_URL or GOOGLE_REDIRECT_URI environment variable."
            )
        
        logger.info(f"Google OAuth callback URI: {callback_uri}")
        logger.info(f"GOOGLE_REDIRECT_URI from settings: {settings.GOOGLE_REDIRECT_URI}")
        logger.info(f"BASE_URL from settings: {settings.BASE_URL}")
        
        # Google OAuth 2.0 authorization endpoint
        google_auth_base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": callback_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        
        # Add state parameter if frontend redirect URL is provided
        if redirect:
            params["state"] = redirect
        
        auth_url = f"{google_auth_base_url}?{urlencode(params)}"
        
        logger.info(f"Generated Google OAuth URL (length: {len(auth_url)})")
        logger.info(f"Returning response with auth_url")
        
        response_data = {"auth_url": auth_url}
        logger.info(f"Response data prepared: {response_data}")
        
        return response_data
    except HTTPException as e:
        logger.error(f"HTTPException in get_google_auth_url: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating Google OAuth URL: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Google OAuth URL: {str(e)}"
        )


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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format: {str(e)}"
        )


@router.get("/google/callback")
async def google_oauth_callback(
    request: Request,
    code: Annotated[str, Query(description="Authorization code from Google")],
    db: Annotated[AsyncSession, Depends(get_db)],
    state: Annotated[str | None, Query(description="State parameter (frontend redirect URL)")] = None,
):
    """
    Handle Google OAuth callback
    
    Args:
        request: FastAPI request object
        code: Authorization code from Google
        state: Optional state parameter (frontend redirect URL)
        db: Database session
    
    Returns:
        Redirect to frontend with token
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    # Build redirect URI - must match EXACTLY the one used in /google endpoint
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    # Clean up the URI: remove quotes, whitespace, and trailing slashes
    if redirect_uri:
        redirect_uri = redirect_uri.strip().strip('"').strip("'").rstrip("/")
    if not redirect_uri:
        # Use BASE_URL from settings if available, otherwise construct from request
        if settings.BASE_URL:
            backend_base_url = settings.BASE_URL.rstrip("/")
            logger.info(f"Using BASE_URL from settings for redirect_uri: {backend_base_url}")
        else:
            # Try to get base URL from request, but handle potential DNS issues
            try:
                backend_base_url = str(request.base_url).rstrip("/")
                # Validate the URL is properly formed
                parsed = urlparse(backend_base_url)
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError("Invalid base_url from request")
                logger.info(f"Using request.base_url for redirect_uri: {backend_base_url}")
            except Exception as e:
                logger.error(f"Error getting base_url from request: {e}")
                # Fallback to BASE_URL from settings or environment variable
                import os
                backend_base_url = os.getenv("BASE_URL", "http://localhost:8000")
                logger.warning(f"Using fallback base_url from environment: {backend_base_url}")
        redirect_uri = f"{backend_base_url}{settings.API_V1_STR}/auth/google/callback"
    
    # Ensure redirect_uri doesn't have trailing slash (Google is strict about exact match)
    redirect_uri = redirect_uri.rstrip("/")
    
    # Validate redirect_uri before use
    try:
        redirect_uri = validate_url(redirect_uri, "redirect_uri")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating redirect_uri: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Invalid redirect URI configuration: {str(e)}. Please check BASE_URL or GOOGLE_REDIRECT_URI environment variables."
        )
    
    logger.info(f"Google OAuth callback - redirect_uri: {redirect_uri}")
    logger.info(f"Google OAuth callback - code received: {code[:20]}... (truncated)")
    logger.info(f"Google OAuth callback - state: {state}")
    
    try:
        # Exchange authorization code for tokens
        # Configure httpx.AsyncClient with separate connect and total timeouts, connection limits
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=5.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            follow_redirects=True
        ) as client:
            token_request_data = {
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }
            logger.info(f"Google token exchange request - redirect_uri: {redirect_uri}")
            logger.info(f"Google token exchange request - client_id: {settings.GOOGLE_CLIENT_ID[:10]}... (truncated)")
            
            try:
                token_response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data=token_request_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
            except httpx.ConnectError as e:
                logger.error(f"Failed to connect to Google OAuth token endpoint: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Unable to connect to Google authentication service. Please check your internet connection and try again."
                )
            except httpx.TimeoutException as e:
                logger.error(f"Timeout connecting to Google OAuth token endpoint: {e}")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Google authentication service is taking too long to respond. Please try again."
                )
            except httpx.NetworkError as e:
                logger.error(f"Network error connecting to Google OAuth token endpoint: {e}")
                error_msg = str(e)
                if "Name or service not known" in error_msg or "Errno -2" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="DNS resolution failed. Please check your network configuration and DNS settings."
                    )
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Network error connecting to Google authentication service: {error_msg}"
                )
            except Exception as e:
                logger.error(f"Unexpected error connecting to Google OAuth token endpoint: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to connect to Google authentication service: {str(e)}"
                )
            
            logger.info(f"Google token exchange response status: {token_response.status_code}")
            
            if token_response.status_code != 200:
                error_text = token_response.text
                logger.error(f"Google token exchange failed - Status: {token_response.status_code}")
                logger.error(f"Google token exchange failed - Response: {error_text}")
                logger.error(f"Google token exchange failed - Request redirect_uri: {redirect_uri}")
                
                # Try to parse error details if available
                try:
                    error_json = token_response.json()
                    error_detail = error_json.get("error_description", error_json.get("error", "Unknown error"))
                    logger.error(f"Google token exchange error details: {error_detail}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to exchange authorization code: {error_detail}"
                    )
                except HTTPException:
                    raise
                except Exception:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to exchange authorization code: {error_text}"
                    )
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            id_token = token_data.get("id_token")  # JWT containing user info
            
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No access token received from Google"
                )
            
            # Try to extract user info from id_token first (avoids extra HTTP request)
            email = None
            name = ""
            picture = None
            google_user_id = None
            
            if id_token:
                try:
                    # Decode JWT without verification (Google already verified it)
                    # The id_token is already validated by Google, so we can decode it
                    # JWT format: header.payload.signature
                    parts = id_token.split('.')
                    if len(parts) >= 2:
                        # Decode payload (add padding if needed)
                        payload = parts[1]
                        # Add padding for base64 decoding
                        padding_needed = (4 - len(payload) % 4) % 4
                        payload += '=' * padding_needed
                        decoded_payload = base64.urlsafe_b64decode(payload)
                        id_token_data = json.loads(decoded_payload)
                        
                        email = id_token_data.get("email")
                        name = id_token_data.get("name", "")
                        picture = id_token_data.get("picture")
                        google_user_id = id_token_data.get("sub")  # Google user ID
                        
                        logger.info(f"Extracted user info from id_token: email={email}, name={name}")
                except Exception as e:
                    logger.warning(f"Failed to extract user info from id_token: {e}, will fetch from userinfo endpoint")
            
            # If we don't have email from id_token, fetch from userinfo endpoint
            # Note: google_user_id is optional, but email is required
            if not email:
                # Retry logic for userinfo request
                max_retries = 3
                retry_delay = 1.0  # Start with 1 second
                userinfo_response = None
                last_error = None
                
                for attempt in range(max_retries):
                    try:
                        logger.info(f"Fetching user info from Google (attempt {attempt + 1}/{max_retries})")
                        userinfo_response = await client.get(
                            "https://www.googleapis.com/oauth2/v2/userinfo",
                            headers={"Authorization": f"Bearer {access_token}"},
                            timeout=10.0,
                        )
                        
                        if userinfo_response.status_code == 200:
                            break  # Success, exit retry loop
                        else:
                            logger.warning(f"Google userinfo returned status {userinfo_response.status_code}: {userinfo_response.text}")
                            if attempt < max_retries - 1:
                                await asyncio.sleep(retry_delay)
                                retry_delay *= 2  # Exponential backoff
                                
                    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
                        last_error = e
                        error_msg = str(e)
                        is_dns_error = "Name or service not known" in error_msg or "Errno -2" in error_msg
                        
                        logger.warning(f"Error fetching userinfo (attempt {attempt + 1}/{max_retries}): {error_msg}")
                        
                        if attempt < max_retries - 1:
                            # Wait before retry with exponential backoff
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2
                            logger.info(f"Retrying in {retry_delay} seconds...")
                        else:
                            # Last attempt failed
                            if isinstance(e, httpx.ConnectError):
                                raise HTTPException(
                                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                    detail="Unable to connect to Google user information service after multiple attempts. Please try again later."
                                )
                            elif isinstance(e, httpx.TimeoutException):
                                raise HTTPException(
                                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                                    detail="Google user information service is taking too long to respond. Please try again."
                                )
                            elif is_dns_error:
                                raise HTTPException(
                                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                    detail="DNS resolution failed when fetching user information. This may be a temporary network issue. Please try again."
                                )
                            else:
                                raise HTTPException(
                                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                    detail=f"Network error connecting to Google user information service: {error_msg}"
                                )
                    except Exception as e:
                        logger.error(f"Unexpected error fetching userinfo: {e}", exc_info=True)
                        last_error = e
                        if attempt < max_retries - 1:
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2
                        else:
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Failed to get user information from Google: {str(e)}"
                            )
                
                # Process userinfo response
                if userinfo_response and userinfo_response.status_code == 200:
                    google_user = userinfo_response.json()
                    email = google_user.get("email") or email
                    name = google_user.get("name", "") or name
                    picture = google_user.get("picture") or picture
                    google_user_id = google_user.get("id") or google_user_id
                elif userinfo_response:
                    logger.error(f"Google userinfo failed with status {userinfo_response.status_code}: {userinfo_response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to get user information from Google: {userinfo_response.text}"
                    )
                else:
                    # Should not happen, but handle it
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Failed to get user information from Google after multiple attempts"
                    )
            
            # Verify we have required information
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Google"
                )
            
            # Split name into first_name and last_name
            name_parts = name.split(" ", 1) if name else ["", ""]
            first_name = name_parts[0] if len(name_parts) > 0 else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            # Database operations with retry logic and fresh session
            # Use a fresh database session for critical operations after Google API calls
            # The original session might be stale after long-running HTTP requests
            from app.core.database import AsyncSessionLocal
            
            max_db_retries = 3
            db_retry_delay = 0.5  # Start with 0.5 seconds
            user = None
            is_new_user = False
            
            for db_attempt in range(max_db_retries):
                # Create a fresh session for each attempt to ensure connection validity
                async with AsyncSessionLocal() as fresh_db:
                    try:
                        # Check if user exists
                        result = await fresh_db.execute(
                            select(User).where(User.email == email)
                        )
                        user = result.scalar_one_or_none()
                        is_new_user = user is None
                        
                        # Create or update user
                        if user:
                            # Update existing user
                            user.first_name = first_name or user.first_name
                            user.last_name = last_name or user.last_name
                            # Mark as active if not already
                            if not user.is_active:
                                user.is_active = True
                        else:
                            # Create new user
                            # Generate a random password since Google OAuth users don't have passwords
                            # Bcrypt has a 72-byte limit, so we use token_hex(32) which generates 64 hex characters (64 bytes)
                            # This is safely under the 72-byte limit
                            import secrets
                            random_password = secrets.token_hex(32)  # 32 bytes * 2 = 64 hex characters = 64 bytes (safe)
                            logger.debug(f"Generated password for Google OAuth user: {len(random_password)} chars, {len(random_password.encode('utf-8'))} bytes")
                            hashed_password = get_password_hash(random_password)
                            
                            user = User(
                                email=email,
                                hashed_password=hashed_password,
                                first_name=first_name,
                                last_name=last_name,
                                is_active=True,
                            )
                            fresh_db.add(user)
                        
                        await fresh_db.commit()
                        await fresh_db.refresh(user)
                        break  # Success, exit retry loop
                        
                    except Exception as db_error:
                        error_str = str(db_error)
                        error_type = type(db_error).__name__
                        error_module = type(db_error).__module__
                        
                        # Check if it's a database connection error
                        is_db_connection_error = (
                            "sqlalchemy" in error_module.lower() or
                            "asyncpg" in error_module.lower() or
                            "psycopg" in error_module.lower() or
                            "OperationalError" in error_type or
                            "DatabaseError" in error_type or
                            "postgres" in error_str.lower() or
                            "database" in error_str.lower() or
                            "connection" in error_str.lower() or
                            "pool" in error_str.lower() or
                            "timeout" in error_str.lower()
                        )
                        
                        # Check if it's a missing table error (migrations not run)
                        is_missing_table_error = (
                            "UndefinedTableError" in error_type or
                            "relation" in error_str.lower() and "does not exist" in error_str.lower() or
                            "table" in error_str.lower() and "does not exist" in error_str.lower()
                        )
                        
                        if is_missing_table_error:
                            # Missing table error - migrations not run, don't retry
                            logger.error(
                                f"Database table missing during Google OAuth: {error_str}. "
                                f"This usually means database migrations have not been run successfully."
                            )
                            raise HTTPException(
                                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail="Database tables are missing. Please ensure database migrations have been run successfully. The Google OAuth authentication succeeded, but user data could not be saved because the database schema is incomplete."
                            )
                        elif is_db_connection_error and db_attempt < max_db_retries - 1:
                            # Retry with exponential backoff
                            logger.warning(
                                f"Database connection error during Google OAuth (attempt {db_attempt + 1}/{max_db_retries}): {error_str}. "
                                f"Retrying in {db_retry_delay} seconds with fresh session..."
                            )
                            await asyncio.sleep(db_retry_delay)
                            db_retry_delay *= 2  # Exponential backoff
                            
                            # Rollback the failed transaction
                            try:
                                await fresh_db.rollback()
                            except Exception:
                                pass  # Ignore rollback errors
                        else:
                            # Last attempt failed or not a connection error - re-raise
                            logger.error(
                                f"Database error during Google OAuth (attempt {db_attempt + 1}/{max_db_retries}): {error_str}",
                                exc_info=True
                            )
                            raise
            
            # Create JWT token (use email as subject, consistent with login endpoint)
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            jwt_token = create_access_token(
                data={"sub": user.email, "type": "access"},
                expires_delta=access_token_expires,
            )
            
            # Log successful Google OAuth login
            # Use a fresh session for audit logging to avoid connection issues
            try:
                client_ip = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
                async with AsyncSessionLocal() as audit_db:
                    await SecurityAuditLogger.log_authentication_event(
                        db=audit_db,
                        event_type=SecurityEventType.LOGIN_SUCCESS,
                        description=f"User logged in via Google OAuth: {user.email}",
                        user_id=user.id,
                        user_email=user.email,
                        ip_address=client_ip,
                        user_agent=user_agent,
                        request_method=request.method,
                        request_path=str(request.url.path),
                        success="success",
                        metadata={"login_method": "google_oauth", "is_new_user": is_new_user}
                    )
                    await audit_db.commit()
            except Exception as e:
                # Don't fail the request if audit logging fails
                logger.error(f"Failed to log Google OAuth authentication event: {e}", exc_info=True)
            
            # Determine frontend redirect URL
            # If state is already a full URL (starts with http), use it directly
            # Otherwise, construct the URL from state or use FRONTEND_URL from settings
            import os
            # Get frontend URL from settings (CORS_ORIGINS first item) or environment variable
            frontend_base = None
            if settings.CORS_ORIGINS and isinstance(settings.CORS_ORIGINS, list) and len(settings.CORS_ORIGINS) > 0:
                frontend_base = settings.CORS_ORIGINS[0].rstrip("/")
                logger.info(f"Using frontend base from CORS_ORIGINS list: {frontend_base}")
            elif isinstance(settings.CORS_ORIGINS, str) and settings.CORS_ORIGINS.strip():
                frontend_base = settings.CORS_ORIGINS.strip().rstrip("/")
                logger.info(f"Using frontend base from CORS_ORIGINS string: {frontend_base}")
            
            if not frontend_base:
                frontend_base = os.getenv("FRONTEND_URL") or os.getenv("NEXT_PUBLIC_APP_URL")
                if frontend_base:
                    frontend_base = frontend_base.rstrip("/")
                    logger.info(f"Using frontend base from environment variable: {frontend_base}")
                else:
                    frontend_base = "http://localhost:3000"
                    logger.warning(f"Frontend base not configured, using fallback: {frontend_base}")
            
            logger.info(f"Final frontend base URL: {frontend_base}, state: {state}")
            
            # Default locale for next-intl (usually 'en' or 'fr')
            # This ensures the redirect goes to the correct localized route
            default_locale = os.getenv("DEFAULT_LOCALE", "fr")
            
            if state and state.startswith(("http://", "https://")):
                # State is already a full URL, use it directly
                frontend_url = state.rstrip("/")
                redirect_url = f"{frontend_url}?token={jwt_token}&type=google"
            elif state:
                # State is a relative path (e.g., "/auth/callback")
                # Ensure it starts with / and doesn't end with /
                state_path = state if state.startswith("/") else f"/{state}"
                state_path = state_path.rstrip("/")
                
                # If state doesn't include locale, add it for next-intl compatibility
                if not state_path.startswith(f"/{default_locale}/"):
                    redirect_url = f"{frontend_base}/{default_locale}{state_path}?token={jwt_token}&type=google"
                else:
                    redirect_url = f"{frontend_base}{state_path}?token={jwt_token}&type=google"
            else:
                # No state provided, use default callback URL with locale
                redirect_url = f"{frontend_base}/{default_locale}/auth/callback?token={jwt_token}&type=google"
            
            logger.info(f"Google OAuth successful for user {email}, redirecting to {redirect_url}")
            
            # Use HTTP 302 redirect (standard OAuth redirect)
            # This is the most reliable method for OAuth callbacks
            logger.info(f"Returning HTTP 302 redirect to: {redirect_url}")
            return RedirectResponse(url=redirect_url, status_code=302)
            
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
    except httpx.ConnectError as e:
        logger.error(f"Connection error in Google OAuth callback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to connect to Google authentication service. Please check your internet connection and DNS settings."
        )
    except httpx.TimeoutException as e:
        logger.error(f"Timeout error in Google OAuth callback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Google authentication service is taking too long to respond. Please try again."
        )
    except httpx.NetworkError as e:
        logger.error(f"Network error in Google OAuth callback: {e}", exc_info=True)
        error_msg = str(e)
        if "Name or service not known" in error_msg or "Errno -2" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="DNS resolution failed. Please check your network configuration, DNS settings, and ensure the backend server has internet connectivity."
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Network error during Google authentication: {error_msg}"
        )
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
        error_msg = str(e)
        error_type = type(e).__name__
        error_module = type(e).__module__
        
        # Check if this is a database connection error (not Google-related)
        # Check exception type and module
        is_database_exception = (
            "sqlalchemy" in error_module.lower() or
            "asyncpg" in error_module.lower() or
            "psycopg" in error_module.lower() or
            "OperationalError" in error_type or
            "DatabaseError" in error_type
        )
        
        # Check error message for database-related keywords
        is_database_error_msg = (
            "postgres" in error_msg.lower() or
            "railway.internal" in error_msg.lower() or
            "database" in error_msg.lower() or
            "asyncpg" in error_msg.lower() or
            "sqlalchemy" in error_msg.lower() or
            "connection pool" in error_msg.lower()
        )
        
        # Check if it's a missing table error (migrations not run)
        is_missing_table_error = (
            "UndefinedTableError" in error_type or
            "relation" in error_msg.lower() and "does not exist" in error_msg.lower() or
            "table" in error_msg.lower() and "does not exist" in error_msg.lower()
        )
        
        # Check if it's a DNS error that's likely from database (not Google)
        is_dns_error = "Name or service not known" in error_msg or "Errno -2" in error_msg
        
        # If it's a DNS error and we're not in an httpx context, it's likely database
        # (httpx errors are caught earlier, so if we get here with DNS error, it's likely DB)
        is_database_dns_error = (
            is_dns_error and 
            (is_database_exception or is_database_error_msg or 
             ("socket.gaierror" in str(type(e)) and not isinstance(e, (httpx.ConnectError, httpx.NetworkError))))
        )
        
        is_database_error = is_database_exception or is_database_error_msg or is_database_dns_error
        
        # Check if this is a Google API DNS error
        is_google_dns_error = (
            is_dns_error and
            not is_database_error and
            ("googleapis.com" in error_msg or "google.com" in error_msg or isinstance(e, (httpx.ConnectError, httpx.NetworkError)))
        )
        
        if is_database_error:
            # Database connection error - different issue
            if is_missing_table_error:
                logger.error(f"Database table missing during Google OAuth: {error_msg} (type: {error_type}, module: {error_module})")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database tables are missing. Please ensure database migrations have been run successfully. The Google OAuth authentication succeeded, but user data could not be saved because the database schema is incomplete."
                )
            else:
                logger.error(f"Database connection error during Google OAuth: {error_msg} (type: {error_type}, module: {error_module})")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection failed. Please check your database configuration and ensure the database service is available. The Google OAuth authentication succeeded, but user data could not be saved."
                )
        elif is_google_dns_error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="DNS resolution failed when connecting to Google's servers. Please check your network configuration and ensure the backend server has internet connectivity."
            )
        else:
            # Generic error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Authentication failed: {error_msg}"
            )

