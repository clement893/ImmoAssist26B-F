"""
API path compatibility middleware.

Rewrites requests from /api/transactions/* to /api/v1/transactions/*
so that clients calling /api/transactions/{id}/contacts (without v1) still work.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class ApiTransactionsCompatMiddleware(BaseHTTPMiddleware):
    """Rewrite /api/transactions/ -> /api/v1/transactions/ for backward compatibility."""

    async def dispatch(self, request: Request, call_next):
        path = request.scope.get("path") or ""
        if path.startswith("/api/transactions/") and "/api/v1/transactions/" not in path:
            # Rewrite /api/transactions/1/contacts -> /api/v1/transactions/1/contacts
            new_path = path.replace("/api/transactions/", "/api/v1/transactions/", 1)
            request.scope["path"] = new_path
        return await call_next(request)
