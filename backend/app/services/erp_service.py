"""
ERP Service
Service for employee/ERP portal data operations
"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.invoice import Invoice
from app.models.project import Project
from app.core.tenancy_helpers import apply_tenant_scope


class ERPService:
    """Service for ERP portal operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_orders(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        client_id: Optional[int] = None,
    ) -> tuple[List, int]:
        """
        Get all orders (for ERP employees)
        
        Args:
            user_id: Employee user ID (for audit)
            skip: Number of records to skip
            limit: Maximum number of records
            status: Optional status filter
            client_id: Optional client filter
            
        Returns:
            Tuple of (orders list, total count)
        """
        # Note: This assumes an Order model exists
        # For now, return empty list
        return [], 0
    
    async def get_all_invoices(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        client_id: Optional[int] = None,
    ) -> tuple[List[Invoice], int]:
        """
        Get all invoices (for ERP employees)
        
        Args:
            user_id: Employee user ID (for audit)
            skip: Number of records to skip
            limit: Maximum number of records
            status: Optional status filter
            client_id: Optional client filter
            
        Returns:
            Tuple of (invoices list, total count)
        """
        # Build query - all invoices (not scoped to user)
        query = select(Invoice)
        
        if status:
            query = query.where(Invoice.status == status)
        
        if client_id:
            query = query.where(Invoice.user_id == client_id)
        
        # Apply tenant scoping if enabled
        query = apply_tenant_scope(query, Invoice)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Get paginated results with user relationship (eager loading to prevent N+1)
        query = query.options(selectinload(Invoice.user))
        query = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        invoices = result.scalars().all()
        
        return list(invoices), total
    
    async def get_invoice(self, invoice_id: int) -> Optional[Invoice]:
        """
        Get a specific invoice (for ERP employees)
        
        Args:
            invoice_id: Invoice ID
            
        Returns:
            Invoice object or None
        """
        query = select(Invoice).where(Invoice.id == invoice_id)
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, Invoice)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_clients(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
    ) -> tuple[List[User], int]:
        """
        Get all clients (for ERP employees)
        
        Args:
            user_id: Employee user ID (for audit)
            skip: Number of records to skip
            limit: Maximum number of records
            is_active: Optional active status filter
            
        Returns:
            Tuple of (clients list, total count)
        """
        # Get users with client role
        # Note: This is simplified - in production, you'd check user roles
        query = select(User)
        
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, User)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Get paginated results
        query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        return list(users), total
    
    async def get_client(self, client_id: int) -> Optional[User]:
        """
        Get a specific client (for ERP employees)
        
        Args:
            client_id: Client user ID
            
        Returns:
            User object or None
        """
        query = select(User).where(User.id == client_id)
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, User)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_inventory_products(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        low_stock_only: bool = False,
    ) -> tuple[List, int]:
        """
        Get inventory products
        
        Args:
            user_id: Employee user ID
            skip: Number of records to skip
            limit: Maximum number of records
            low_stock_only: Filter only low stock items
            
        Returns:
            Tuple of (products list, total count)
        """
        # Placeholder - will be implemented when Product/Inventory model exists
        return [], 0
    
    async def get_inventory_movements(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[int] = None,
        movement_type: Optional[str] = None,
    ) -> tuple[List, int]:
        """
        Get inventory movements
        
        Args:
            user_id: Employee user ID
            skip: Number of records to skip
            limit: Maximum number of records
            product_id: Optional product filter
            movement_type: Optional movement type filter
            
        Returns:
            Tuple of (movements list, total count)
        """
        # Placeholder - will be implemented when InventoryMovement model exists
        return [], 0
    
    async def get_reports(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        report_type: Optional[str] = None,
    ) -> tuple[List, int]:
        """
        Get ERP reports
        
        Args:
            user_id: Employee user ID
            skip: Number of records to skip
            limit: Maximum number of records
            report_type: Optional report type filter
            
        Returns:
            Tuple of (reports list, total count)
        """
        # Placeholder - will be implemented when Report model exists
        return [], 0
    
    async def get_erp_dashboard_stats(self, user_id: int, department: Optional[str] = None):
        """
        Get dashboard statistics for ERP
        
        Args:
            user_id: Employee user ID
            department: Optional department filter
            
        Returns:
            Dictionary with dashboard statistics
        """
        import time
        from app.core.slow_query_logger import log_slow_query_async, SLOW_QUERY_THRESHOLD
        
        start_time = time.time()
        
        # Get invoice stats
        from app.models.invoice import InvoiceStatus
        invoice_query = select(
            func.count(Invoice.id).label("total"),
            func.sum(Invoice.amount_due).label("total_amount"),
            func.sum(
                case((Invoice.status == InvoiceStatus.OPEN, Invoice.amount_due), else_=0)
            ).label("pending_amount"),
            func.count(
                case((Invoice.status == InvoiceStatus.PAID, 1), else_=None)
            ).label("paid_count"),
            func.count(
                case((Invoice.status == InvoiceStatus.OPEN, 1), else_=None)
            ).label("pending_count"),
        )
        
        invoice_query = apply_tenant_scope(invoice_query, Invoice)
        invoice_result = await self.db.execute(invoice_query)
        invoice_stats = invoice_result.first()
        
        # Get client stats
        client_query = select(
            func.count(User.id).label("total"),
            func.count(
                case((User.is_active == True, 1), else_=None)
            ).label("active"),
        )
        
        client_query = apply_tenant_scope(client_query, User)
        client_result = await self.db.execute(client_query)
        client_stats = client_result.first()
        
        # Get project stats
        project_query = select(
            func.count(Project.id).label("total"),
            func.count(
                case((Project.status == "active", 1), else_=None)
            ).label("active"),
        )
        
        project_query = apply_tenant_scope(project_query, Project)
        project_result = await self.db.execute(project_query)
        project_stats = project_result.first()
        
        # Log slow query if threshold exceeded
        execution_time = time.time() - start_time
        if execution_time > SLOW_QUERY_THRESHOLD:
            await log_slow_query_async(
                invoice_query,
                execution_time,
                SLOW_QUERY_THRESHOLD
            )
        
        return {
            "total_invoices": invoice_stats.total or 0,
            "pending_invoices": invoice_stats.pending_count or 0,
            "paid_invoices": invoice_stats.paid_count or 0,
            "total_clients": client_stats.total or 0,
            "active_clients": client_stats.active or 0,
            "total_projects": project_stats.total or 0,
            "active_projects": project_stats.active or 0,
            "total_revenue": Decimal(str(invoice_stats.total_amount or 0)),
            "pending_revenue": Decimal(str(invoice_stats.pending_amount or 0)),
            "total_orders": 0,  # Will be calculated when Order model exists
            "pending_orders": 0,
            "completed_orders": 0,
            "total_products": 0,  # Will be calculated when Product model exists
            "low_stock_products": 0,
        }
    
    def filter_by_department(
        self,
        user: User,
        query,
        model_class,
        department: Optional[str] = None
    ):
        """
        Filter query by user's department
        
        Args:
            user: Current user
            query: SQLAlchemy query
            model_class: Model class
            department: Optional department override
            
        Returns:
            Filtered query
        """
        # If department is specified, use it
        if department:
            # Department-based filtering logic
            # This is a placeholder - implement based on your department structure
            pass
        
        # Check user's roles for department
        # If user has 'sales' role, they might only see sales-related data
        # If user has 'accounting' role, they might only see accounting-related data
        # This is simplified - implement based on your requirements
        
        return query

