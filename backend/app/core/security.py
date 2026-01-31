"""Security and authentication utilities."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import ValidationError

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_secret_key() -> str:
    """
    Get SECRET_KEY from environment with strict validation.
    
    Retrieves the secret key from environment variables and validates it.
    In production, raises an error if SECRET_KEY is not set, is too short,
    or is the default value. In development, uses a default key with a warning.
    
    Returns:
        str: The secret key (minimum 32 characters)
        
    Raises:
        ValueError: If SECRET_KEY is not set in production, is too short,
                   is the default value in production, or has insufficient entropy
    """
    secret_key = os.getenv("SECRET_KEY")
    env = os.getenv("ENVIRONMENT", "development").lower()
    default_key = "change-this-secret-key-in-production"
    
    if not secret_key:
        if env == "production":
            raise ValueError(
                "SECRET_KEY must be set in production. "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        secret_key = default_key
    
    # Validation stricte de la longueur
    if len(secret_key) < 32:
        raise ValueError("SECRET_KEY must be at least 32 characters long")
    
    # VÃ©rifier que ce n'est pas la clÃ© par dÃ©faut en production
    if env == "production" and secret_key == default_key:
        raise ValueError(
            "SECRET_KEY must be changed from default value in production. "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    
    # VÃ©rifier l'entropie (au moins 20 caractÃ¨res uniques) en production
    if env == "production" and len(set(secret_key)) < 20:
        raise ValueError(
            "SECRET_KEY must have sufficient entropy (at least 20 unique characters). "
            "Generate a stronger key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    
    return secret_key


# JWT settings
SECRET_KEY = get_secret_key()
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))  # Default: 2 hours (120 minutes)
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))  # Default: 7 days


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Decode a JWT token with proper error handling and type validation."""
    from app.core.logging import logger
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # VÃ©rifier le type de token
        payload_token_type = payload.get("type")
        if payload_token_type != token_type:
            logger.warning(
                f"Token type mismatch: expected {token_type}, got {payload_token_type}"
            )
            return None
        
        return payload
    except JWTError as e:
        logger.warning(f"JWT error: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {e}", exc_info=True)
        return None
