"""
Custom Exception Classes
Standardized exceptions for the application
"""

from typing import Any, Dict, Optional


class AppException(Exception):
    """Base application exception"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class BadRequestException(AppException):
    """400 Bad Request"""

    def __init__(self, message: str = "Bad request", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 400, details)


class UnauthorizedException(AppException):
    """401 Unauthorized"""

    def __init__(self, message: str = "Unauthorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 401, details)


class ForbiddenException(AppException):
    """403 Forbidden"""

    def __init__(self, message: str = "Forbidden", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 403, details)


class NotFoundException(AppException):
    """404 Not Found"""

    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 404, details)


class ConflictException(AppException):
    """409 Conflict"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 409, details)


class ValidationException(AppException):
    """422 Validation Error"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 422, details)


class InternalServerException(AppException):
    """500 Internal Server Error"""

    def __init__(self, message: str = "Internal server error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 500, details)

