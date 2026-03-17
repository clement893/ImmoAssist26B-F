"""
Centralized Error Handler
Handles all exceptions and returns standardized error responses
"""

from typing import Dict, Union

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import AppException
from app.core.logging import logger
from app.core.logging_utils import sanitize_log_data
from app.core.cors import get_cors_origins, validate_origin


def _add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    """Add CORS headers to error response"""
    try:
        origin = request.headers.get("Origin", "")
        cors_origins = get_cors_origins()
        
        # Determine allowed origin
        allowed_origin = None
        
        if origin:
            # Check if origin is in allowed list
            if cors_origins and validate_origin(origin, cors_origins):
                allowed_origin = origin
            # Check if wildcard is allowed
            elif "*" in cors_origins:
                allowed_origin = "*"
            # Check Railway domain pattern (production fallback)
            elif origin and (".up.railway.app" in origin or ".railway.app" in origin):
                # Allow Railway domains even if not explicitly configured
                allowed_origin = origin
            # Use first allowed origin if available
            elif cors_origins:
                allowed_origin = cors_origins[0]
        
        # If still no origin, try Railway fallback
        if not allowed_origin and origin and (".up.railway.app" in origin or ".railway.app" in origin):
            allowed_origin = origin
        
        if allowed_origin:
            response.headers["Access-Control-Allow-Origin"] = allowed_origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key, X-Signature, X-Timestamp, X-CSRF-Token, X-Bootstrap-Key"
    except Exception as e:
        # If CORS header addition fails, log but don't break the error response
        logger.warning(f"Failed to add CORS headers to error response: {e}")
    
    return response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions"""
    from app.core.config import settings
    
    context = sanitize_log_data({
        "status_code": exc.status_code,
        "details": exc.details,
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        f"Application error: {exc.message}",
        context=context,
        exc_info=exc,
    )

    # En production, masquer les détails pour éviter la fuite d'information
    if settings.ENVIRONMENT == "production":
        error_response = {
            "success": False,
            "error": {
                "code": "APPLICATION_ERROR",
                "message": "An error occurred. Please contact support if the problem persists.",
            },
            "timestamp": None,
        }
    else:
        # En développement, permettre plus de détails
        error_response = {
            "success": False,
            "error": {
                "code": exc.__class__.__name__,
                "message": exc.message,
                "details": exc.details,
            },
            "timestamp": None,
        }

    response = JSONResponse(
        status_code=exc.status_code,
        content=error_response,
    )
    return _add_cors_headers(response, request)


async def validation_exception_handler(
    request: Request, exc: PydanticValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        error_msg = error["msg"]
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error_msg,
            "code": error["type"],
        })
        # Log each validation error with full details (use error level to ensure visibility)
        field_path = ".".join(str(loc) for loc in error['loc'])
        logger.error(
            f"VALIDATION ERROR - Path: {request.url.path} | Field: {field_path} | Message: {error_msg} | Type: {error['type']}",
            context={
                "field": field_path,
                "error_message": error_msg,  # Use 'error_message' instead of 'message' to avoid conflict
                "code": error["type"],
                "path": request.url.path,
                "method": request.method,
                "full_error": error,
            },
        )

    context = sanitize_log_data({
        "errors": errors,
        "path": request.url.path,
        "method": request.method,
    })
    logger.warning(
        "Validation error",
        context=context,
    )

    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "validationErrors": errors,
            },
            "timestamp": None,
        },
    )
    return _add_cors_headers(response, request)


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle database errors"""
    context = sanitize_log_data({
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        "Database error",
        context=context,
        exc_info=exc,
    )

    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database error occurred",
                "details": {},
            },
            "timestamp": None,
        },
    )
    return _add_cors_headers(response, request)


async def http_exception_handler(request: Request, exc: FastAPIHTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions"""
    context = sanitize_log_data({
        "status_code": exc.status_code,
        "detail": exc.detail,
        "path": request.url.path,
        "method": request.method,
    })
    
    # Log warnings for client errors (4xx), errors for server errors (5xx)
    if exc.status_code >= 500:
        logger.error(
            f"HTTP exception: {exc.status_code}",
            context=context,
        )
    else:
        # For 400 errors, log with more detail to help debug
        if exc.status_code == 400:
            logger.warning(
                f"HTTP exception: {exc.status_code} - {exc.detail if isinstance(exc.detail, str) else 'Bad Request'}",
                context=context,
            )
        else:
            logger.warning(
                f"HTTP exception: {exc.status_code}",
                context=context,
            )

    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail if isinstance(exc.detail, str) else "An error occurred",
                "details": exc.detail if not isinstance(exc.detail, str) else None,
            },
            "timestamp": None,
        },
    )
    return _add_cors_headers(response, request)


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions"""
    from app.core.config import settings
    
    context = sanitize_log_data({
        "path": request.url.path,
        "method": request.method,
    })
    logger.error(
        f"Unhandled exception: {exc}",
        context=context,
        exc_info=exc,
    )

    # En production, ne pas exposer les détails de l'exception
    import os
    is_production = (
        os.getenv("ENVIRONMENT", "").lower() == "production" or
        os.getenv("RAILWAY_ENVIRONMENT") is not None
    )
    if is_production:
        error_response = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal error occurred. Please contact support.",
            },
            "timestamp": None,
        }
    else:
        # En développement, permettre plus de détails pour le débogage
        error_response = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
                "type": exc.__class__.__name__,
            },
            "timestamp": None,
        }

    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response,
    )
    return _add_cors_headers(response, request)

