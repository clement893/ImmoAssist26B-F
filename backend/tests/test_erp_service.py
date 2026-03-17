"""
Tests for ERP Service
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.erp_service import ERPService
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User


@pytest.fixture
def mock_db():
    """Mock database session"""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def erp_service(mock_db):
    """ERP service instance"""
    return ERPService(mock_db)


@pytest.mark.asyncio
async def test_get_all_invoices(erp_service, mock_db):
    """Test getting all invoices (ERP)"""
    # Mock invoices
    invoice1 = MagicMock(spec=Invoice)
    invoice1.id = 1
    invoice1.invoice_number = "INV-001"
    invoice1.status = InvoiceStatus.OPEN
    invoice1.user_id = 1
    
    invoice2 = MagicMock(spec=Invoice)
    invoice2.id = 2
    invoice2.invoice_number = "INV-002"
    invoice2.status = InvoiceStatus.PAID
    invoice2.user_id = 2
    
    # Mock query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [invoice1, invoice2]
    mock_db.execute.return_value = mock_result
    
    # Mock count query
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 2
    mock_db.execute.return_value = mock_count_result
    
    # Test
    invoices, total = await erp_service.get_all_invoices(
        user_id=1,
        skip=0,
        limit=10
    )
    
    assert total == 2
    assert len(invoices) == 2


@pytest.mark.asyncio
async def test_get_all_invoices_with_filters(erp_service, mock_db):
    """Test getting all invoices with filters"""
    # Mock invoice
    invoice = MagicMock(spec=Invoice)
    invoice.id = 1
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
    invoices, total = await erp_service.get_all_invoices(
        user_id=1,
        skip=0,
        limit=10,
        status="paid",
        client_id=1
    )
    
    assert total == 1
    assert len(invoices) == 1


@pytest.mark.asyncio
async def test_get_all_clients(erp_service, mock_db):
    """Test getting all clients"""
    # Mock clients
    client1 = MagicMock(spec=User)
    client1.id = 1
    client1.email = "client1@example.com"
    client1.is_active = True
    
    client2 = MagicMock(spec=User)
    client2.id = 2
    client2.email = "client2@example.com"
    client2.is_active = True
    
    # Mock query result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [client1, client2]
    mock_db.execute.return_value = mock_result
    
    # Mock count query
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 2
    mock_db.execute.return_value = mock_count_result
    
    # Test
    clients, total = await erp_service.get_all_clients(
        user_id=1,
        skip=0,
        limit=10
    )
    
    assert total == 2
    assert len(clients) == 2


@pytest.mark.asyncio
async def test_get_erp_dashboard_stats(erp_service, mock_db):
    """Test getting ERP dashboard statistics"""
    # Mock query results
    mock_invoice_result = MagicMock()
    mock_invoice_result.first.return_value = MagicMock(
        total=20,
        total_amount=5000.00,
        pending_amount=1000.00,
        paid_count=15,
        pending_count=5
    )
    
    mock_client_result = MagicMock()
    mock_client_result.first.return_value = MagicMock(
        total=10,
        active=8
    )
    
    mock_project_result = MagicMock()
    mock_project_result.first.return_value = MagicMock(
        total=15,
        active=10
    )
    
    # Set up mock execute to return different results
    async def mock_execute(query):
        query_str = str(query)
        if "invoices" in query_str.lower():
            return mock_invoice_result
        elif "users" in query_str.lower() or "clients" in query_str.lower():
            return mock_client_result
        elif "projects" in query_str.lower():
            return mock_project_result
        return MagicMock()
    
    mock_db.execute.side_effect = mock_execute
    
    # Test
    stats = await erp_service.get_erp_dashboard_stats(user_id=1)
    
    assert stats["total_invoices"] == 20
    assert stats["paid_invoices"] == 15
    assert stats["pending_invoices"] == 5
    assert stats["total_clients"] == 10
    assert stats["active_clients"] == 8
    assert stats["total_projects"] == 15
    assert stats["active_projects"] == 10

