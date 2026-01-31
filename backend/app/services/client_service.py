"""
Client Service
Service for client portal data operations
"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.invoice import Invoice
from app.models.project import Project
from app.models.support_ticket import SupportTicket
from app.core.tenancy_helpers import apply_tenant_scope


class ClientService:
    """Service for client portal operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_client_orders(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> tuple[List, int]:
        """
        Get orders for a specific client (user)
        
        Args:
            user_id: Client user ID
            skip: Number of records to skip
            limit: Maximum number of records
            status: Optional status filter
            
        Returns:
            Tuple of (orders list, total count)
        """
        # Note: This assumes an Order model exists
        # For now, we'll use a placeholder query structure
        # In a real implementation, you would have:
        # from app.models.order import Order
        # query = select(Order).where(Order.client_id == user_id)
        
        # Placeholder - will be implemented when Order model exists
        # For now, return empty list
        return [], 0
    
    async def get_client_order(self, user_id: int, order_id: int):
        """
        Get a specific order for a client
        
        Args:
            user_id: Client user ID
            order_id: Order ID
            
        Returns:
            Order object or None
        """
        # Placeholder - will be implemented when Order model exists
        return None
    
    async def get_client_invoices(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> tuple[List[Invoice], int]:
        """
        Get invoices for a specific client
        
        Args:
            user_id: Client user ID
            skip: Number of records to skip
            limit: Maximum number of records
            status: Optional status filter
            
        Returns:
            Tuple of (invoices list, total count)
        """
        # Build query
        query = select(Invoice).where(Invoice.user_id == user_id)
        
        if status:
            query = query.where(Invoice.status == status)
        
        # Apply tenant scoping if enabled
        query = apply_tenant_scope(query, Invoice)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Get paginated results with eager loading to prevent N+1 queries
        query = query.options(selectinload(Invoice.user), selectinload(Invoice.subscription))
        query = query.order_by(Invoice.invoice_date.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        invoices = result.scalars().all()
        
        return list(invoices), total
    
    async def get_client_invoice(self, user_id: int, invoice_id: int) -> Optional[Invoice]:
        """
        Get a specific invoice for a client
        
        Args:
            user_id: Client user ID
            invoice_id: Invoice ID
            
        Returns:
            Invoice object or None
        """
        query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id,
            )
        )
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, Invoice)
        
        # Eager load relationships to prevent N+1 queries
        query = query.options(selectinload(Invoice.user), selectinload(Invoice.subscription))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_client_projects(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> tuple[List[Project], int]:
        """
        Get projects for a specific client
        
        Args:
            user_id: Client user ID
            skip: Number of records to skip
            limit: Maximum number of records
            status: Optional status filter
            
        Returns:
            Tuple of (projects list, total count)
        """
        query = select(Project).where(Project.user_id == user_id)
        
        if status:
            query = query.where(Project.status == status)
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, Project)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Get paginated results
        query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        projects = result.scalars().all()
        
        return list(projects), total
    
    async def get_client_project(self, user_id: int, project_id: int) -> Optional[Project]:
        """
        Get a specific project for a client
        
        Args:
            user_id: Client user ID
            project_id: Project ID
            
        Returns:
            Project object or None
        """
        query = select(Project).where(
            and_(
                Project.id == project_id,
                Project.user_id == user_id,
            )
        )
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, Project)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_client_tickets(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
    ) -> tuple[List[SupportTicket], int]:
        """
        Get support tickets for a specific client
        
        Args:
            user_id: Client user ID
            skip: Number of records to skip
            limit: Maximum number of records
            status: Optional status filter
            
        Returns:
            Tuple of (tickets list, total count)
        """
        query = select(SupportTicket).where(SupportTicket.user_id == user_id)
        
        if status:
            query = query.where(SupportTicket.status == status)
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, SupportTicket)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Get paginated results
        query = query.order_by(SupportTicket.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        tickets = result.scalars().all()
        
        return list(tickets), total
    
    async def get_client_ticket(self, user_id: int, ticket_id: int) -> Optional[SupportTicket]:
        """
        Get a specific support ticket for a client
        
        Args:
            user_id: Client user ID
            ticket_id: Ticket ID
            
        Returns:
            SupportTicket object or None
        """
        query = select(SupportTicket).where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == user_id,
            )
        )
        
        # Apply tenant scoping
        query = apply_tenant_scope(query, SupportTicket)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def create_client_ticket(
        self,
        user_id: int,
        subject: str,
        description: str,
        priority: str = "medium",
        category: str = "general",
    ) -> SupportTicket:
        """
        Create a new support ticket for a client
        
        Args:
            user_id: Client user ID
            subject: Ticket subject
            description: Ticket description (will be added as first message)
            priority: Ticket priority
            category: Ticket category
            
        Returns:
            Created SupportTicket object
        """
        from app.models.support_ticket import TicketMessage
        
        ticket = SupportTicket(
            user_id=user_id,
            subject=subject,
            category=category,
            priority=priority,
            status="open",
        )
        
        self.db.add(ticket)
        await self.db.flush()  # Flush to get ticket ID
        
        # Create first message with description
        first_message = TicketMessage(
            ticket_id=ticket.id,
            user_id=user_id,
            message=description,
            is_staff=False,
        )
        
        self.db.add(first_message)
        await self.db.commit()
        await self.db.refresh(ticket)
        
        return ticket
    
    async def get_client_dashboard_stats(self, user_id: int):
        """
        Get dashboard statistics for a client
        
        Args:
            user_id: Client user ID
            
        Returns:
            Dictionary with dashboard statistics
        """
        import time
        from app.core.slow_query_logger import log_slow_query_async, SLOW_QUERY_THRESHOLD
        
        start_time = time.time()
        
        # Get invoice stats
        invoice_query = select(
            func.count(Invoice.id).label("total"),
            func.sum(Invoice.amount).label("total_amount"),
            func.sum(
                func.case((Invoice.status == "pending", Invoice.amount), else_=0)
            ).label("pending_amount"),
        ).where(Invoice.user_id == user_id)
        
        invoice_query = apply_tenant_scope(invoice_query, Invoice)
        invoice_result = await self.db.execute(invoice_query)
        invoice_stats = invoice_result.first()
        
        # Get project stats
        project_query = select(
            func.count(Project.id).label("total"),
            func.count(
                func.case((Project.status == "active", 1), else_=None)
            ).label("active"),
        ).where(Project.user_id == user_id)
        
        project_query = apply_tenant_scope(project_query, Project)
        project_result = await self.db.execute(project_query)
        project_stats = project_result.first()
        
        # Get ticket stats
        ticket_query = select(
            func.count(SupportTicket.id).label("open"),
        ).where(
            and_(
                SupportTicket.user_id == user_id,
                SupportTicket.status == "open",
            )
        )
        
        ticket_query = apply_tenant_scope(ticket_query, SupportTicket)
        ticket_result = await self.db.execute(ticket_query)
        ticket_stats = ticket_result.first()
        
        # Log slow query if threshold exceeded
        execution_time = time.time() - start_time
        if execution_time > SLOW_QUERY_THRESHOLD:
            await log_slow_query_async(
                select(Invoice).where(Invoice.user_id == user_id),
                execution_time,
                SLOW_QUERY_THRESHOLD
            )
        
        return {
            "total_invoices": invoice_stats.total or 0,
            "pending_invoices": 0,  # Will be calculated from status
            "paid_invoices": 0,  # Will be calculated from status
            "total_projects": project_stats.total or 0,
            "active_projects": project_stats.active or 0,
            "open_tickets": ticket_stats.open or 0,
            "total_spent": Decimal(str(invoice_stats.total_amount or 0)),
            "pending_amount": Decimal(str(invoice_stats.pending_amount or 0)),
        }

