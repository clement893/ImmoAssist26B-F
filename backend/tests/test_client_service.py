"""
Tests for Client Service
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.client_service import ClientService
from app.models.invoice import Invoice, InvoiceStatus
from app.models.project import Project
from app.models.support_ticket import SupportTicket, TicketStatus
from app.models.user import User


@pytest.fixture
def mock_db():
    """Mock database session"""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def client_service(mock_db):
    """Client service instance"""
    return ClientService(mock_db)


@pytest.mark.asyncio
async def test_get_client_invoices(client_service, mock_db):
    """Test getting client invoices"""
    # Mock user
    user = MagicMock(spec=User)
    user.id = 1
    
    # Mock invoices
    invoice1 = MagicMock(spec=Invoice)
    invoice1.id = 1
    invoice1.invoice_number = "INV-001"
    invoice1.amount_due = 100.00
    invoice1.status = InvoiceStatus.OPEN
    invoice1.user_id = 1
    
    invoice2 = MagicMock(spec=Invoice)
    invoice2.id = 2
    invoice2.invoice_number = "INV-002"
    invoice2.amount_due = 200.00
    invoice2.status = InvoiceStatus.PAID
    invoice2.user_id = 1
    
    # Mock query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [invoice1, invoice2]
    mock_db.execute.return_value = mock_result
    
    # Mock count query
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 2
    mock_db.execute.return_value = mock_count_result
    
    # Test
    invoices, total = await client_service.get_client_invoices(
        user_id=1,
        skip=0,
        limit=10
    )
    
    assert total == 2
    assert len(invoices) == 2


@pytest.mark.asyncio
async def test_get_client_invoices_with_status_filter(client_service, mock_db):
    """Test getting client invoices with status filter"""
    # Mock invoice
    invoice = MagicMock(spec=Invoice)
    invoice.id = 1
    invoice.invoice_number = "INV-001"
    invoice.status = InvoiceStatus.PAID
    invoice.user_id = 1
    
    # Mock query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [invoice]
    mock_db.execute.return_value = mock_result
    
    # Mock count query
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 1
    mock_db.execute.return_value = mock_count_result
    
    # Test
    invoices, total = await client_service.get_client_invoices(
        user_id=1,
        skip=0,
        limit=10,
        status="paid"
    )
    
    assert total == 1
    assert len(invoices) == 1


@pytest.mark.asyncio
async def test_get_client_projects(client_service, mock_db):
    """Test getting client projects"""
    # Mock project
    project = MagicMock(spec=Project)
    project.id = 1
    project.name = "Test Project"
    project.user_id = 1
    
    # Mock query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [project]
    mock_db.execute.return_value = mock_result
    
    # Mock count query
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 1
    mock_db.execute.return_value = mock_count_result
    
    # Test
    projects, total = await client_service.get_client_projects(
        user_id=1,
        skip=0,
        limit=10
    )
    
    assert total == 1
    assert len(projects) == 1


@pytest.mark.asyncio
async def test_get_client_tickets(client_service, mock_db):
    """Test getting client tickets"""
    # Mock ticket
    ticket = MagicMock(spec=SupportTicket)
    ticket.id = 1
    ticket.subject = "Test Ticket"
    ticket.status = TicketStatus.OPEN
    ticket.user_id = 1
    
    # Mock query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [ticket]
    mock_db.execute.return_value = mock_result
    
    # Mock count query
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 1
    mock_db.execute.return_value = mock_count_result
    
    # Test
    tickets, total = await client_service.get_client_tickets(
        user_id=1,
        skip=0,
        limit=10
    )
    
    assert total == 1
    assert len(tickets) == 1


@pytest.mark.asyncio
async def test_get_client_dashboard_stats(client_service, mock_db):
    """Test getting client dashboard statistics"""
    # Mock query results
    mock_invoice_result = MagicMock()
    mock_invoice_result.first.return_value = MagicMock(
        total=10,
        total_amount=1000.00,
        pending_amount=200.00,
        paid_count=8,
        pending_count=2
    )
    
    mock_project_result = MagicMock()
    mock_project_result.first.return_value = MagicMock(
        total=5,
        active=3
    )
    
    mock_ticket_result = MagicMock()
    mock_ticket_result.first.return_value = MagicMock(
        open_count=2
    )
    
    # Set up mock execute to return different results
    async def mock_execute(query):
        query_str = str(query)
        if "invoices" in query_str.lower():
            return mock_invoice_result
        elif "projects" in query_str.lower():
            return mock_project_result
        elif "tickets" in query_str.lower():
            return mock_ticket_result
        return MagicMock()
    
    mock_db.execute.side_effect = mock_execute
    
    # Test
    stats = await client_service.get_client_dashboard_stats(user_id=1)
    
    assert stats["total_invoices"] == 10
    assert stats["paid_invoices"] == 8
    assert stats["pending_invoices"] == 2
    assert stats["total_projects"] == 5
    assert stats["active_projects"] == 3
    assert stats["open_tickets"] == 2

