"""
Tenancy Middleware

Middleware to extract and set tenant context from requests.
Supports multiple strategies:
1. X-Tenant-ID header (for API clients)
2. User's primary team (from authenticated user)
3. Query parameter ?tenant_id= (for testing/admin)

This middleware is conditionally enabled based on TENANCY_MODE.
"""

from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.tenancy import TenancyConfig, set_current_tenant, get_current_tenant, clear_current_tenant
from app.core.logging import logger


class TenancyMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract tenant from request and set it in context.
    
    This middleware is only active when TENANCY_MODE is not 'single'.
    It extracts tenant ID from:
    1. X-Tenant-ID header (highest priority)
    2. Query parameter ?tenant_id= (for testing)
    3. User's primary team (if authenticated)
    
    The tenant ID is stored in a context variable for use in query scoping.
    """
    
    def __init__(self, app, header_name: str = "X-Tenant-ID", query_param: str = "tenant_id"):
        super().__init__(app)
        self.header_name = header_name
        self.query_param = query_param
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request and extract tenant ID.
        
        If tenancy is disabled, this middleware does nothing.
        """
        # Clear tenant context at start of request
        clear_current_tenant()
        
        # If tenancy is disabled, skip middleware logic
        if TenancyConfig.is_single_mode():
            response = await call_next(request)
            return response
        
        tenant_id: Optional[int] = None
        
        # Strategy 1: Check X-Tenant-ID header (highest priority)
        tenant_header = request.headers.get(self.header_name)
        if tenant_header:
            try:
                tenant_id = int(tenant_header)
            except (ValueError, TypeError):
                logger.warning(f"Invalid {self.header_name} header value: {tenant_header}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid {self.header_name} header. Must be an integer."
                )
        
        # Strategy 2: Check query parameter (for testing/admin)
        if tenant_id is None:
            tenant_query = request.query_params.get(self.query_param)
            if tenant_query:
                try:
                    tenant_id = int(tenant_query)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid {self.query_param} query parameter: {tenant_query}")
                    # Don't raise error for query param, just log and continue
        
        # Strategy 3: Get from authenticated user's primary team
        # This is handled in get_tenant_scope dependency, not here
        # to avoid circular dependencies with authentication
        
        # Set tenant in context
        if tenant_id is not None:
            set_current_tenant(tenant_id)
            logger.debug(f"Tenant context set: {tenant_id}")
        
        try:
            response = await call_next(request)
        finally:
            # Always clear tenant context after request
            clear_current_tenant()
        
        return response

