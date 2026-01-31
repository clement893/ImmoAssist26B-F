"""
Application Configuration
Uses Pydantic Settings for validation
"""

import os
from functools import lru_cache
from typing import List, Union, Optional

from pydantic import Field, PostgresDsn, field_validator, model_validator, field_serializer
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation"""

    # Project
    PROJECT_NAME: str = Field(
        default=os.getenv("PROJECT_NAME", "API"),
        description="Project name"
    )
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI backend with OpenAPI/Swagger auto-generation"
    API_V1_STR: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    BASE_URL: str = Field(
        default="",
        description="Base URL of the backend (for OAuth callbacks). If empty, will be constructed from request.",
    )

    # CORS - Accept string or list, will be converted to list
    # Use environment variable CORS_ORIGINS or FRONTEND_URL, fallback to localhost for development
    CORS_ORIGINS: Union[str, List[str]] = Field(
        default_factory=lambda: (
            os.getenv("CORS_ORIGINS", "") or
            os.getenv("FRONTEND_URL", "http://localhost:3000")
        ),
        description="Allowed CORS origins (comma-separated string or JSON array). Set CORS_ORIGINS env var for multiple origins.",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS_ORIGINS from environment variable"""
        import json
        import os
        
        # Detect if we're in production (Railway or explicit ENVIRONMENT=production)
        is_production = (
            os.getenv("ENVIRONMENT", "").lower() == "production" or
            os.getenv("RAILWAY_ENVIRONMENT") is not None or
            os.getenv("RAILWAY_SERVICE_NAME") is not None
        )
        
        # If already a list, return as-is
        if isinstance(v, list):
            return v
        
        # If None or empty, use default based on environment
        if not v or (isinstance(v, str) and not v.strip()):
            # Try to get from FRONTEND_URL env var, fallback to localhost
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            return [frontend_url]
        
        # If string, parse it
        if isinstance(v, str):
            # Try JSON first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            
            # Try comma-separated
            if "," in v:
                origins = [origin.strip() for origin in v.split(",") if origin.strip()]
                if origins:
                    return origins
            
            # Single string
            if v.strip():
                return [v.strip()]
        
        # Fallback - use FRONTEND_URL or default to localhost
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return [frontend_url]

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def ensure_cors_origins_list(cls, v):
        """Ensure CORS_ORIGINS is always a list"""
        import os
        
        # Detect if we're in production
        is_production = (
            os.getenv("ENVIRONMENT", "").lower() == "production" or
            os.getenv("RAILWAY_ENVIRONMENT") is not None or
            os.getenv("RAILWAY_SERVICE_NAME") is not None
        )
        
        if isinstance(v, str):
            # If it's still a string after parsing, convert to list
            if v.strip():
                return [v.strip()]
            # Empty string - use FRONTEND_URL or default to localhost
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            return [frontend_url]
        if isinstance(v, list):
            return v
        # Fallback - use FRONTEND_URL or default to localhost
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return [frontend_url]

    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql+asyncpg://user:CHANGE_PASSWORD@localhost:5432/modele",
        description="Database connection URL",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str | PostgresDsn) -> str:
        if isinstance(v, str):
            # Convert postgresql:// to postgresql+asyncpg:// for async support
            if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            return v
        return str(v)

    # Security
    SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production",
        description="Secret key for JWT tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=120,
        description="Access token expiration time in minutes (default: 120 = 2 hours)"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY is set and secure"""
        import os
        env = os.getenv("ENVIRONMENT", "development")
        
        if not v or v == "change-this-secret-key-in-production":
            if env == "production":
                raise ValueError(
                    "SECRET_KEY must be set to a secure value in production. "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
        elif len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        
        return v

    # OpenAPI
    OPENAPI_TAGS: List[dict] = Field(
        default_factory=lambda: [
            {"name": "auth", "description": "Authentication"},
            {"name": "users", "description": "User management"},
        ]
    )

    # Redis Cache (optional)
    REDIS_URL: str = Field(
        default="",
        description="Redis connection URL for caching",
    )

    # SendGrid Email Configuration
    SENDGRID_API_KEY: str = Field(
        default="",
        description="SendGrid API key for sending emails",
    )
    SENDGRID_FROM_EMAIL: str = Field(
        default="noreply@example.com",
        description="Default sender email address",
    )
    SENDGRID_FROM_NAME: str = Field(
        default=os.getenv("PROJECT_NAME", "App"),
        description="Default sender name",
    )

    @field_validator("SENDGRID_FROM_EMAIL")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """Validate email format"""
        import re
        if v and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError(f"Invalid email format: {v}")
        return v

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate DATABASE_URL is set in production"""
        import os
        env = os.getenv("ENVIRONMENT", "development")
        
        if env == "production":
            if not v or v == "postgresql+asyncpg://user:password@localhost:5432/modele":
                raise ValueError(
                    "DATABASE_URL must be set to a valid PostgreSQL connection string in production"
                )
        
        return v

    # Database Connection Pool Configuration
    DB_POOL_SIZE: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Database connection pool size (base connections)",
    )
    DB_MAX_OVERFLOW: int = Field(
        default=20,
        ge=0,
        le=50,
        description="Database connection pool max overflow (additional connections)",
    )
    DB_POOL_TIMEOUT: int = Field(
        default=30,
        ge=5,
        le=120,
        description="Timeout for getting connection from pool (seconds)",
    )
    DB_QUERY_TIMEOUT: int = Field(
        default=60,
        ge=10,
        le=300,
        description="Query execution timeout (seconds)",
    )
    SLOW_QUERY_THRESHOLD: float = Field(
        default=1.0,
        ge=0.1,
        le=10.0,
        description="Threshold in seconds to log slow queries",
    )

    # Multi-Tenancy Configuration
    TENANCY_MODE: str = Field(
        default="single",
        description="Tenancy mode: 'single' (no multi-tenancy), 'shared_db' (shared DB with team_id), 'separate_db' (one DB per tenant)",
    )
    TENANT_DB_REGISTRY_URL: Optional[str] = Field(
        default=None,
        description="Database URL for tenant registry (used in separate_db mode)",
    )
    TENANT_DB_BASE_URL: Optional[str] = Field(
        default=None,
        description="Base database URL for tenant databases (used in separate_db mode for pattern-based DB creation)",
    )

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = Field(
        default="",
        description="Stripe secret key",
    )
    STRIPE_PUBLISHABLE_KEY: str = Field(
        default="",
        description="Stripe publishable key",
    )
    STRIPE_WEBHOOK_SECRET: str = Field(
        default="",
        description="Stripe webhook secret for signature verification",
    )

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = Field(
        default="",
        description="Google OAuth client ID",
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default="",
        description="Google OAuth client secret",
    )
    GOOGLE_REDIRECT_URI: str = Field(
        default="",
        description="Google OAuth redirect URI",
    )

    # AI Provider Configuration
    OPENAI_API_KEY: str = Field(
        default="",
        description="OpenAI API key",
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4o-mini",
        description="OpenAI model to use",
    )
    OPENAI_MAX_TOKENS: int = Field(
        default=1000,
        ge=1,
        le=4000,
        description="Maximum tokens for OpenAI responses",
    )
    OPENAI_TEMPERATURE: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Temperature for OpenAI responses",
    )
    
    ANTHROPIC_API_KEY: str = Field(
        default="",
        description="Anthropic (Claude) API key",
    )
    ANTHROPIC_MODEL: str = Field(
        default="claude-3-haiku-20240307",
        description="Anthropic model to use",
    )
    ANTHROPIC_MAX_TOKENS: int = Field(
        default=1024,
        ge=1,
        le=4096,
        description="Maximum tokens for Anthropic responses",
    )
    ANTHROPIC_TEMPERATURE: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Temperature for Anthropic responses",
    )

    # SendGrid Marketing Lists
    SENDGRID_NEWSLETTER_LIST_ID: str = Field(
        default="",
        description="SendGrid Marketing Contacts list ID for newsletter subscriptions",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
