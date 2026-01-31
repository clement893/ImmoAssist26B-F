"""
IP Whitelisting Middleware
Restricts admin endpoints to whitelisted IP addresses
"""

import os
from typing import List, Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger


def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    # Check X-Forwarded-For header (for proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP (original client)
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to direct client IP
    if request.client:
        return request.client.host
    
    return "unknown"


def parse_ip_whitelist(whitelist_str: Optional[str]) -> List[str]:
    """Parse IP whitelist from environment variable"""
    if not whitelist_str:
        return []
    
    # Support comma-separated or space-separated
    ips = []
    for ip in whitelist_str.replace(",", " ").split():
        ip = ip.strip()
        if ip:
            ips.append(ip)
    
    return ips


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """Middleware to restrict endpoints to whitelisted IPs"""
    
    def __init__(self, app, whitelist: List[str], admin_paths: List[str] = None):
        super().__init__(app)
        self.whitelist = whitelist
        self.admin_paths = admin_paths or ["/api/v1/admin"]
    
    def is_admin_path(self, path: str) -> bool:
        """Check if path is an admin path"""
        return any(path.startswith(admin_path) for admin_path in self.admin_paths)
    
    def is_ip_allowed(self, ip: str) -> bool:
        """Check if IP is in whitelist"""
        if not self.whitelist:
            return True  # No whitelist means allow all
        
        # Exact match
        if ip in self.whitelist:
            return True
        
        # CIDR notation support (basic)
        for allowed_ip in self.whitelist:
            if "/" in allowed_ip:
                # Basic CIDR check (simplified)
                # For production, use ipaddress module
                try:
                    from ipaddress import ip_address, ip_network
                    client_addr = ip_address(ip)
                    network = ip_network(allowed_ip, strict=False)
                    if client_addr in network:
                        return True
                except (ValueError, ImportError):
                    pass
        
        return False
    
    async def dispatch(self, request: Request, call_next):
        """Check IP whitelist for admin endpoints"""
        
        # Only check whitelist for admin paths
        if not self.is_admin_path(str(request.url.path)):
            return await call_next(request)
        
        # Get client IP
        client_ip = get_client_ip(request)
        
        # Check if IP is allowed
        if not self.is_ip_allowed(client_ip):
            logger.warning(f"⚠️ IP whitelist violation: {client_ip} attempted to access {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: IP address not whitelisted"
            )
        
        response = await call_next(request)
        return response


def setup_ip_whitelist(app, admin_paths: List[str] = None) -> None:
    """Setup IP whitelist middleware"""
    # Get whitelist from environment
    whitelist_str = os.getenv("ADMIN_IP_WHITELIST", "")
    whitelist = parse_ip_whitelist(whitelist_str)
    
    if whitelist:
        app.add_middleware(
            IPWhitelistMiddleware,
            whitelist=whitelist,
            admin_paths=admin_paths or ["/api/v1/admin"],
        )
        logger.info(f"✅ IP whitelist enabled for admin endpoints: {whitelist}")
    else:
        logger.warning("⚠️ ADMIN_IP_WHITELIST not set - admin endpoints accessible from any IP")

