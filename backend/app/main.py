"""
FastAPI Main Application
Configured with OpenAPI/Swagger auto-generation
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.cache import init_cache, close_cache
from app.core.migrations import ensure_theme_preference_column, ensure_avatar_column
from app.core.exceptions import AppException
from app.core.error_handler import (
    app_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler,
    http_exception_handler,
)
from app.core.rate_limit import setup_rate_limiting
from app.core.compression import CompressionMiddleware
from app.core.cache_headers import CacheHeadersMiddleware
from app.core.csrf import CSRFMiddleware
from app.core.request_limits import RequestSizeLimitMiddleware
from app.core.cors import setup_cors
from app.core.api_versioning import setup_api_versioning
from app.core.ip_whitelist import setup_ip_whitelist
from app.core.request_signing import RequestSigningMiddleware
from app.api.v1.router import api_router
from app.api import email as email_router
from app.api.webhooks import stripe as stripe_webhook_router
from app.api import upload as upload_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events"""
    import sys
    import os
    import asyncio
    
    # Use print for critical startup messages to ensure they're visible even if logging fails
    print("=" * 50, file=sys.stderr)
    print("FastAPI Application Starting...", file=sys.stderr)
    print("=" * 50, file=sys.stderr)
    
    try:
        from app.core.logging import logger
    except (ImportError, AttributeError) as e:
        print(f"WARNING: Failed to initialize logger: {e}", file=sys.stderr)
        logger = None
    except Exception as e:
        # Keep generic Exception as last resort for logger initialization
        print(f"WARNING: Unexpected error initializing logger: {e}", file=sys.stderr)
        logger = None
    
    # Log environment info early
    if logger:
        logger.info(f"CORS Origins configured: {settings.CORS_ORIGINS}")
        logger.info(f"ENVIRONMENT: {os.getenv('ENVIRONMENT', 'NOT SET')}")
        logger.info(f"RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT', 'NOT SET')}")
        logger.info(f"RAILWAY_SERVICE_NAME: {os.getenv('RAILWAY_SERVICE_NAME', 'NOT SET')}")
    
    print("=" * 50, file=sys.stderr)
    print("✓ FastAPI Application Ready - Starting server", file=sys.stderr)
    print(f"  Environment: {os.getenv('ENVIRONMENT', 'development')}", file=sys.stderr)
    print(f"  Port: {os.getenv('PORT', '8000')}", file=sys.stderr)
    print("  Health endpoint available at: /api/v1/health", file=sys.stderr)
    print("=" * 50, file=sys.stderr)
    
    # Background initialization tasks - these run after the app has started serving requests
    # This allows healthchecks to succeed even if initialization takes time
    async def background_init():
        """Background initialization tasks"""
        try:
            from app.core.logging import logger
        except:
            logger = None
        
        # Startup - make database initialization resilient
        try:
            await init_db()
            if logger:
                logger.info("Database initialized successfully")
            print("✓ Database initialized", file=sys.stderr)
        except (ConnectionError, TimeoutError) as e:
            error_msg = f"Database connection failed: {e}. App will continue but database features may be unavailable."
            if logger:
                logger.error(error_msg)
                logger.warning("The app will start, but database operations will fail until connection is established.")
            print(f"⚠ {error_msg}", file=sys.stderr)
        except Exception as e:
            # Keep generic Exception for unexpected database errors
            error_msg = f"Database initialization failed: {e}. App will continue but database features may be unavailable."
            if logger:
                logger.error(error_msg, exc_info=True)
                logger.warning("The app will start, but database operations will fail until connection is established.")
            print(f"⚠ {error_msg}", file=sys.stderr)
        
        try:
            await init_cache()
            if logger:
                logger.info("Cache initialized successfully")
            print("✓ Cache initialized", file=sys.stderr)
        except (ConnectionError, TimeoutError) as e:
            warning_msg = f"Cache connection failed: {e}. App will continue without cache."
            if logger:
                logger.warning(warning_msg)
            print(f"⚠ {warning_msg}", file=sys.stderr)
        except Exception as e:
            # Keep generic Exception for unexpected cache errors
            warning_msg = f"Cache initialization failed: {e}. App will continue without cache."
            if logger:
                logger.warning(warning_msg, exc_info=True)
            print(f"⚠ {warning_msg}", file=sys.stderr)
        
        # Ensure required columns exist (auto-migration) - only if DB is available
        try:
            await ensure_theme_preference_column()
        except (ConnectionError, TimeoutError) as e:
            if logger:
                logger.warning(f"Theme preference column migration skipped (connection error): {e}")
        except Exception as e:
            # Keep generic Exception for migration errors
            if logger:
                logger.warning(f"Theme preference column migration skipped: {e}", exc_info=True)
        
        # Ensure avatar column exists
        try:
            await ensure_avatar_column()
        except (ConnectionError, TimeoutError) as e:
            if logger:
                logger.warning(f"Avatar column migration skipped (connection error): {e}")
        except Exception as e:
            if logger:
                logger.warning(f"Avatar column migration skipped: {e}", exc_info=True)
        
        # Ensure default theme exists - CRITICAL for template functionality
        # This must succeed for the application to work properly
        theme_created = False
        try:
            from app.core.database import get_db
            from app.api.v1.endpoints.themes import ensure_default_theme
            async for db in get_db():
                try:
                    theme = await ensure_default_theme(db, created_by=1)
                    theme_created = True
                    if logger:
                        logger.info(f"Default theme ensured: {theme.name} (ID: {theme.id}, Active: {theme.is_active})")
                    print(f"✓ Default theme ensured: {theme.name} (ID: {theme.id}, Active: {theme.is_active})", file=sys.stderr)
                except Exception as e:
                    if logger:
                        logger.error(f"CRITICAL: Default theme creation failed: {e}", exc_info=True)
                    print(f"❌ CRITICAL ERROR: Default theme creation failed: {e}", file=sys.stderr)
                    print("   The application may not function correctly without a theme.", file=sys.stderr)
                    # Don't break startup, but log the error prominently
                break
        except Exception as e:
            if logger:
                logger.error(f"CRITICAL: Default theme initialization failed: {e}", exc_info=True)
            print(f"❌ CRITICAL ERROR: Default theme initialization failed: {e}", file=sys.stderr)
            print("   Database connection may be unavailable. Theme will be created on first API call.", file=sys.stderr)
        
        if not theme_created:
            print("⚠️  WARNING: TemplateTheme was not created during startup.", file=sys.stderr)
            print("   It will be created automatically when /api/v1/themes/active is first called.", file=sys.stderr)
        
        # Create recommended indexes (non-blocking, runs after app starts)
        # This runs in the background after the app has started serving requests
        try:
            from app.core.database_indexes import create_recommended_indexes, analyze_tables
            from app.core.database import AsyncSessionLocal
            
            async with AsyncSessionLocal() as session:
                index_results = await create_recommended_indexes(session)
                if index_results.get("created"):
                    if logger:
                        logger.info(f"Created {len(index_results['created'])} indexes")
                if index_results.get("errors"):
                    if logger:
                        logger.warning(f"Failed to create {len(index_results['errors'])} indexes")
                
                # Analyze tables to update statistics
                await analyze_tables(session)
                if logger:
                    logger.info("Index creation/analysis completed")
        except Exception as e:
            if logger:
                logger.warning(f"Index creation/analysis skipped: {e}")
        
        if logger:
            logger.info("Application startup complete")
    
    # Start background initialization as a task BEFORE yielding
    # This allows the app to serve requests immediately while initialization happens in the background
    # The task will run concurrently with the app serving requests
    # Note: In FastAPI lifespan, the event loop is always running, so create_task should work
    init_task = asyncio.create_task(background_init())
    
    # CRITICAL: Yield immediately to allow the app to start serving requests
    # This ensures the health endpoint is available immediately for Railway healthchecks
    # Heavy initialization will happen in the background via init_task
    yield
    
    # Shutdown - wait for background initialization to complete if still running
    # This ensures clean shutdown
    try:
        if init_task and not init_task.done():
            print("Waiting for background initialization to complete...", file=sys.stderr)
            await asyncio.wait_for(init_task, timeout=5.0)
    except asyncio.TimeoutError:
        print("Background initialization timed out during shutdown", file=sys.stderr)
    except Exception as e:
        print(f"Error waiting for background initialization: {e}", file=sys.stderr)
    
    # Shutdown
    print("Shutting down application...", file=sys.stderr)
    try:
        await close_cache()
    except Exception as e:
        if logger:
            logger.warning(f"Cache shutdown error: {e}")
    try:
        await close_db()
    except Exception as e:
        if logger:
            logger.warning(f"Database shutdown error: {e}")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    from app.core.logging import logger
    import os
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=settings.DESCRIPTION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )
    
    # Add a simple root route that doesn't require any dependencies
    @app.get("/")
    async def root():
        """Root endpoint - simple health check"""
        return {
            "status": "ok",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
        }

    # CORS Middleware - MUST be added FIRST to handle preflight requests
    # Using enhanced CORS configuration with tightened security
    setup_cors(app)

    # Request logging middleware (after CORS to log all requests)
    # Note: FastAPI executes middlewares in reverse order of addition
    # So this middleware runs BEFORE CORS middleware (which was added first)
    # We need to let errors propagate to CORS middleware so it can add headers
    @app.middleware("http")
    async def log_requests_middleware(request: Request, call_next):
        from app.core.logging import logger
        from starlette.responses import Response
        import time
        start_time = time.time()
        logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}")
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            # Ensure response is a Response instance before accessing status_code
            if isinstance(response, Response):
                logger.info(f"Request completed: {request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)")
            else:
                logger.info(f"Request completed: {request.method} {request.url.path} ({process_time:.4f}s)")
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"Request failed: {request.method} {request.url.path} - {str(e)} ({process_time:.4f}s)", exc_info=True)
            # Re-raise the exception so CORS middleware can catch it and add headers
            # The CORS middleware will handle the error response with proper headers
            raise

    # Compression Middleware (after CORS)
    # Enhanced compression with Brotli support
    app.add_middleware(
        CompressionMiddleware,
        min_size=1024,  # Only compress responses > 1KB
        compress_level=6,  # Balance between speed and compression ratio
        use_brotli=True,  # Use Brotli if client supports it
    )

    # Cache Headers Middleware
    app.add_middleware(CacheHeadersMiddleware, default_max_age=300)

    # Request Size Limits Middleware (before CSRF to prevent large request processing)
    app.add_middleware(
        RequestSizeLimitMiddleware,
        default_limit=10 * 1024 * 1024,  # 10 MB default
        json_limit=1 * 1024 * 1024,  # 1 MB for JSON
        file_upload_limit=50 * 1024 * 1024,  # 50 MB for file uploads
    )

    # API Versioning Middleware (after CORS, before other middleware)
    setup_api_versioning(app, default_version="v1", supported_versions=["v1"])

    # IP Whitelist Middleware (before CSRF, for admin endpoints)
    setup_ip_whitelist(app, admin_paths=["/api/v1/admin"])

    # Request Signing Middleware (optional, for enhanced API security)
    if os.getenv("ENABLE_REQUEST_SIGNING", "").lower() == "true":
        app.add_middleware(
            RequestSigningMiddleware,
            secret_key=settings.SECRET_KEY,
            header_name="X-Signature",
            timestamp_header="X-Timestamp",
            max_age=300,  # 5 minutes
        )
        logger.info("Request signing enabled")

    # Tenancy Middleware (conditionally enabled)
    # This middleware extracts tenant ID from headers/query params
    # Only active when TENANCY_MODE is not 'single'
    from app.core.tenancy_middleware import TenancyMiddleware
    from app.core.tenancy import TenancyConfig
    if TenancyConfig.is_enabled():
        app.add_middleware(
            TenancyMiddleware,
            header_name="X-Tenant-ID",
            query_param="tenant_id",
        )
        logger.info(f"Tenancy middleware enabled (mode: {TenancyConfig.get_mode()})")

    # CSRF Protection Middleware (after CORS, before routes)
    # Skip CSRF for webhooks and public endpoints
    if not os.getenv("DISABLE_CSRF", "").lower() == "true":
        app.add_middleware(
            CSRFMiddleware,
            secret_key=settings.SECRET_KEY,
            cookie_name="csrf_token",
        )
        logger.info("CSRF protection enabled")
    else:
        logger.warning("CSRF protection is DISABLED - not recommended for production")

    # Rate Limiting (after CORS to allow preflight requests)
    # Can be disabled by setting DISABLE_RATE_LIMITING=true in environment
    if not os.getenv("DISABLE_RATE_LIMITING", "").lower() == "true":
        app = setup_rate_limiting(app)
        logger.info("Rate limiting enabled")
    else:
        logger.warning("Rate limiting is DISABLED - not recommended for production")

    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Include upload router (separate from v1)
    app.include_router(upload_router.router)
    
    # Include email router (separate from v1)
    app.include_router(email_router.router)
    
    # Include webhooks (no prefix, no auth)
    app.include_router(stripe_webhook_router.router)

    # Register exception handlers
    from fastapi.exceptions import HTTPException as FastAPIHTTPException
    app.add_exception_handler(FastAPIHTTPException, http_exception_handler)
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(PydanticValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Add security headers middleware
    @app.middleware("http")
    async def add_security_headers_middleware(request: Request, call_next):
        import time
        from datetime import datetime, timezone
        
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add timestamp headers
        response.headers["X-Response-Time"] = f"{process_time:.4f}s"
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Timestamp"] = datetime.now(timezone.utc).isoformat()
        
        # Add security headers
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy (strict in production, relaxed in development)
        environment = os.getenv("ENVIRONMENT", "development")
        
        if environment == "production":
            # Strict CSP for production - no unsafe-inline or unsafe-eval
            # 
            # SECURITY: Production CSP is strict (no unsafe-inline/unsafe-eval)
            # Use nonces for inline scripts/styles in production
            # See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self'; "  # Strict: no unsafe-inline/eval (use nonces)
                "style-src 'self'; "  # Strict: no unsafe-inline (use nonces)
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
        else:
            # Relaxed CSP for development
            # 
            # SECURITY: CSP is relaxed in development (unsafe-inline/unsafe-eval)
            # This is acceptable for dev but MUST be tightened in production using nonces
            # See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Development only
                "style-src 'self' 'unsafe-inline'; "  # Development only
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-ancestors 'none';"
            )
        response.headers["Content-Security-Policy"] = csp_policy
        
        return response

    # Custom OpenAPI schema
    def custom_openapi() -> dict:
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=settings.PROJECT_NAME,
            version=settings.VERSION,
            description=settings.DESCRIPTION,
            routes=app.routes,
        )

        # Add custom tags
        openapi_schema["tags"] = [
            {
                "name": "auth",
                "description": "Authentication endpoints",
            },
            {
                "name": "users",
                "description": "User management endpoints",
            },
            {
                "name": "health",
                "description": "Health check endpoints",
            },
        ]

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi

    return app


app = create_app()

