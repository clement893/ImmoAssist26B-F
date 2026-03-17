"""
ERP/Employee Portal API Endpoints
"""

from .orders import router as orders_router
from .invoices import router as invoices_router
from .clients import router as clients_router
from .inventory import router as inventory_router
from .reports import router as reports_router
from .dashboard import router as dashboard_router

__all__ = [
    "orders_router",
    "invoices_router",
    "clients_router",
    "inventory_router",
    "reports_router",
    "dashboard_router",
]

