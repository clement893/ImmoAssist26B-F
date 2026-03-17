"""
Client Portal API Endpoints
"""

from .invoices import router as invoices_router
from .projects import router as projects_router
from .tickets import router as tickets_router
from .dashboard import router as dashboard_router

__all__ = [
    "invoices_router",
    "projects_router",
    "tickets_router",
    "dashboard_router",
]

