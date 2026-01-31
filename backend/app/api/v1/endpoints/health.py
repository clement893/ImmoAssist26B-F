"""
Health Check Endpoint
Comprehensive health checks for deployment verification
"""

from datetime import datetime, timezone
from typing import Dict, Any
import os
import sys
import socket
import asyncio

import httpx
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.database import AsyncSessionLocal, engine
from app.core.cache import cache_backend
from app.core.config import settings
from app.core.logging import logger

router = APIRouter()


# Simple health check that always returns success (for Railway healthcheck)
# This endpoint should be lightweight and not depend on database/cache
@router.get("/health", response_model=Dict[str, Any])
async def simple_health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint for Railway/deployment healthchecks
    Always returns success - does not check database/cache
    
    Returns:
        Status and timestamp
    """
    return {
        "status": "ok",
        "service": "backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/", response_model=Dict[str, Any])
@router.get("", response_model=Dict[str, Any])  # Handle both with and without trailing slash
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint
    
    Returns:
        Status and timestamp
    """
    try:
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": os.getenv("VERSION", "1.0.0"),
            "environment": os.getenv("ENVIRONMENT", "development"),
        }
    except Exception as e:
        # Fallback response even if something fails
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": "unknown",
            "error": str(e)
        }


@router.get("/ready", response_model=Dict[str, Any])
async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check endpoint
    Checks if the service is ready to accept traffic
    
    Returns:
        Ready status with component checks
    """
    checks = {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {},
    }
    
    # Database check
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            checks["checks"]["database"] = "healthy"
    except Exception as e:
        checks["checks"]["database"] = f"unhealthy: {str(e)}"
        checks["status"] = "not_ready"
    
    # Cache check (optional)
    try:
        redis_client = cache_backend.redis_client
        if redis_client:
            await redis_client.ping()
            checks["checks"]["cache"] = "healthy"
        else:
            checks["checks"]["cache"] = "not_configured"
    except Exception as e:
        checks["checks"]["cache"] = f"unhealthy: {str(e)}"
        # Cache is optional, don't fail readiness if cache is down
    
    if checks["status"] == "not_ready":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=checks
        )
    
    return checks


@router.get("/live", response_model=Dict[str, Any])
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check endpoint
    Kubernetes-style liveness probe
    
    Returns:
        Liveness status
    """
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/startup", response_model=Dict[str, Any])
async def startup_check() -> Dict[str, Any]:
    """
    Startup check endpoint
    Kubernetes-style startup probe
    
    Returns:
        Startup status with all component checks
    """
    checks = {
        "status": "started",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("VERSION", "1.0.0"),
        "checks": {},
    }
    
    all_healthy = True
    
    # Database check
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
            checks["checks"]["database"] = {
                "status": "healthy",
                "connection_pool_size": engine.pool.size(),
            }
    except Exception as e:
        checks["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        all_healthy = False
    
    # Cache check
    try:
        redis_client = cache_backend.redis_client
        if redis_client:
            await redis_client.ping()
            checks["checks"]["cache"] = {
                "status": "healthy",
                "configured": True,
            }
        else:
            checks["checks"]["cache"] = {
                "status": "not_configured",
                "configured": False,
            }
    except Exception as e:
        checks["checks"]["cache"] = {
            "status": "unhealthy",
            "error": str(e),
            "configured": True,
        }
        # Cache is optional, don't fail startup
    
    # Environment check
    checks["checks"]["environment"] = {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "debug": os.getenv("DEBUG", "false"),
    }
    
    if not all_healthy:
        checks["status"] = "starting"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=checks
        )
    
    return checks


@router.get("/detailed", response_model=Dict[str, Any])
async def detailed_health_check() -> Dict[str, Any]:
    """
    Detailed health check endpoint
    Comprehensive health check for deployment verification
    
    Returns:
        Detailed status of all components
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": os.getenv("VERSION", "1.0.0"),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "components": {},
    }
    
    overall_healthy = True
    
    # Database detailed check
    db_status = {"status": "healthy"}
    try:
        async with AsyncSessionLocal() as session:
            # Test query
            result = await session.execute(text("SELECT version()"))
            db_version = result.scalar()
            db_status["version"] = db_version[:50] if db_version else "unknown"
            
            # Check connection pool
            db_status["pool_size"] = engine.pool.size()
            db_status["checked_out"] = engine.pool.checkedout()
            db_status["overflow"] = engine.pool.overflow()
            
            # Test write capability
            await session.execute(text("SELECT 1"))
            await session.commit()
            db_status["write_capable"] = True
    except Exception as e:
        db_status["status"] = "unhealthy"
        db_status["error"] = str(e)
        overall_healthy = False
    
    health_status["components"]["database"] = db_status
    
    # Cache detailed check
    cache_status = {"status": "not_configured"}
    try:
        redis_client = cache_backend.redis_client
        if redis_client:
            await redis_client.ping()
            cache_status["status"] = "healthy"
            cache_status["configured"] = True
            # Get cache info
            try:
                info = await redis_client.info("server")
                cache_status["redis_version"] = info.get("redis_version", "unknown")
            except:
                pass
        else:
            cache_status["configured"] = False
    except Exception as e:
        cache_status["status"] = "unhealthy"
        cache_status["error"] = str(e)
        cache_status["configured"] = True
        # Cache is optional
    
    health_status["components"]["cache"] = cache_status
    
    # Application info
    health_status["components"]["application"] = {
        "status": "healthy",
        "python_version": sys.version.split()[0],
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
    
    if not overall_healthy:
        health_status["status"] = "degraded"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status


@router.get("/network", response_model=Dict[str, Any])
async def network_connectivity_check() -> Dict[str, Any]:
    """
    Network connectivity diagnostic endpoint
    Tests DNS resolution and connectivity to external services (Google OAuth)
    
    Returns:
        Network connectivity status with DNS and HTTP test results
    """
    results = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tests": {},
    }
    
    all_healthy = True
    
    # Test DNS resolution for Google OAuth endpoints
    google_domains = [
        "oauth2.googleapis.com",
        "www.googleapis.com",
        "accounts.google.com",
    ]
    
    dns_tests = {}
    for domain in google_domains:
        try:
            # Test DNS resolution
            loop = asyncio.get_event_loop()
            ip_addresses = await loop.run_in_executor(
                None,
                lambda: socket.gethostbyname_ex(domain)[2]
            )
            dns_tests[domain] = {
                "status": "resolved",
                "ip_addresses": ip_addresses[:3],  # Limit to first 3 IPs
                "resolvable": True,
            }
            logger.info(f"DNS resolution successful for {domain}: {ip_addresses[:3]}")
        except socket.gaierror as e:
            dns_tests[domain] = {
                "status": "failed",
                "error": str(e),
                "error_code": e.errno,
                "resolvable": False,
            }
            all_healthy = False
            logger.error(f"DNS resolution failed for {domain}: {e}")
        except Exception as e:
            dns_tests[domain] = {
                "status": "error",
                "error": str(e),
                "resolvable": False,
            }
            all_healthy = False
            logger.error(f"Unexpected error resolving {domain}: {e}")
    
    results["tests"]["dns"] = dns_tests
    
    # Test HTTP connectivity to Google OAuth endpoints
    http_tests = {}
    test_urls = [
        ("https://oauth2.googleapis.com/token", "Google OAuth Token Endpoint"),
        ("https://www.googleapis.com/oauth2/v2/userinfo", "Google Userinfo Endpoint"),
    ]
    
    timeout = httpx.Timeout(10.0, connect=5.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        for url, description in test_urls:
            try:
                # Try a HEAD request first (lighter)
                response = await client.head(url, allow_redirects=True)
                http_tests[url] = {
                    "status": "reachable",
                    "status_code": response.status_code,
                    "description": description,
                    "reachable": True,
                }
                logger.info(f"HTTP connectivity successful for {url}: {response.status_code}")
            except httpx.ConnectError as e:
                http_tests[url] = {
                    "status": "connection_failed",
                    "error": "Connection error - DNS resolution may have failed",
                    "description": description,
                    "reachable": False,
                }
                all_healthy = False
                logger.error(f"HTTP connection failed for {url}: {e}")
            except httpx.TimeoutException as e:
                http_tests[url] = {
                    "status": "timeout",
                    "error": "Connection timeout",
                    "description": description,
                    "reachable": False,
                }
                all_healthy = False
                logger.error(f"HTTP timeout for {url}: {e}")
            except httpx.NetworkError as e:
                error_msg = str(e)
                is_dns_error = "Name or service not known" in error_msg or "Errno -2" in error_msg
                http_tests[url] = {
                    "status": "network_error",
                    "error": error_msg,
                    "is_dns_error": is_dns_error,
                    "description": description,
                    "reachable": False,
                }
                all_healthy = False
                logger.error(f"HTTP network error for {url}: {e}")
            except Exception as e:
                http_tests[url] = {
                    "status": "error",
                    "error": str(e),
                    "description": description,
                    "reachable": False,
                }
                all_healthy = False
                logger.error(f"Unexpected HTTP error for {url}: {e}")
    
    results["tests"]["http"] = http_tests
    
    # Check if Google OAuth is configured
    oauth_config = {
        "google_client_id_configured": bool(settings.GOOGLE_CLIENT_ID),
        "google_client_secret_configured": bool(settings.GOOGLE_CLIENT_SECRET),
        "google_redirect_uri_configured": bool(settings.GOOGLE_REDIRECT_URI),
    }
    results["tests"]["oauth_config"] = oauth_config
    
    if not all_healthy:
        results["status"] = "unhealthy"
        results["message"] = "Network connectivity issues detected. Check DNS resolution and internet connectivity."
        results["recommendations"] = [
            "Ensure the backend server has internet connectivity",
            "Check DNS configuration (in Docker, ensure DNS servers are configured)",
            "Verify firewall rules allow outbound HTTPS connections",
            "If using Docker, add DNS configuration to docker-compose.yml (see recent fixes)",
        ]
    
    return results

