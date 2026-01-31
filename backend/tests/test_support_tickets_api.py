"""
Tests for Support Tickets API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.support_ticket import SupportTicket, TicketMessage
from app.models.user import User
from app.core.auth import create_access_token


def test_create_ticket(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new support ticket"""
    ticket_data = {
        "subject": "Test Ticket",
        "category": "technical",
        "priority": "medium",
        "message": "This is a test ticket message",
    }
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/v1/support/tickets",
        json=ticket_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == ticket_data["subject"]
    assert data["category"] == ticket_data["category"]
    assert data["status"] == "open"


@pytest.mark.asyncio
async def test_get_ticket(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a ticket by ID"""
    # Create a test ticket
    ticket = SupportTicket(
        subject="Test Ticket",
        category="technical",
        status="open",
        priority="medium",
        user_id=test_user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        f"/api/v1/support/tickets/{ticket.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == ticket.id
    assert data["subject"] == "Test Ticket"


@pytest.mark.asyncio
async def test_list_tickets(client: TestClient, test_user: User, db: AsyncSession):
    """Test listing tickets"""
    # Create test tickets
    for i in range(3):
        ticket = SupportTicket(
            subject=f"Test Ticket {i}",
            category="technical",
            status="open",
            priority="medium",
            user_id=test_user.id,
        )
        db.add(ticket)
    await db.commit()
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/support/tickets",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


@pytest.mark.asyncio
async def test_add_ticket_message(client: TestClient, test_user: User, db: AsyncSession):
    """Test adding a message to a ticket"""
    # Create a test ticket
    ticket = SupportTicket(
        subject="Test Ticket",
        category="technical",
        status="open",
        priority="medium",
        user_id=test_user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    message_data = {
        "message": "This is a test reply",
    }
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        f"/api/v1/support/tickets/{ticket.id}/messages",
        json=message_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["message"] == message_data["message"]
    assert data["ticket_id"] == ticket.id


@pytest.mark.asyncio
async def test_get_ticket_messages(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting messages for a ticket"""
    # Create a test ticket
    ticket = SupportTicket(
        subject="Test Ticket",
        category="technical",
        status="open",
        priority="medium",
        user_id=test_user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    # Create test messages
    for i in range(2):
        message = TicketMessage(
            ticket_id=ticket.id,
            message=f"Test message {i}",
            user_id=test_user.id,
            is_staff=False,
        )
        db.add(message)
    await db.commit()
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        f"/api/v1/support/tickets/{ticket.id}/messages",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_update_ticket(client: TestClient, test_user: User, db: AsyncSession):
    """Test updating a ticket"""
    # Create a test ticket
    ticket = SupportTicket(
        subject="Test Ticket",
        category="technical",
        status="open",
        priority="medium",
        user_id=test_user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    update_data = {
        "status": "in_progress",
        "priority": "high",
    }
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.put(
        f"/api/v1/support/tickets/{ticket.id}",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"
    assert data["priority"] == "high"

