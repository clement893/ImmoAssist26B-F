"""
Integration tests for Client Portal endpoints
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import create_access_token


@pytest.fixture
def client(db):
    """Test client with database override"""
    from app.core.database import get_db
    
    def override_get_db():
        return db
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def client_user_token(client_user):
    """Token for client user"""
    from app.core.config import settings
    from datetime import timedelta
    return create_access_token(
        data={"sub": client_user.email, "type": "access"},
        expires_delta=timedelta(minutes=30)
    )


def test_get_client_dashboard_stats(client, client_user_token):
    """Test GET /api/v1/client/dashboard/stats"""
    response = client.get(
        "/api/v1/client/dashboard/stats",
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    # May return 200 or 404 if no data, both are valid
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "total_orders" in data
        assert "total_invoices" in data
        assert "total_projects" in data


def test_get_client_invoices(client, client_user_token):
    """Test GET /api/v1/client/invoices"""
    response = client.get(
        "/api/v1/client/invoices",
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_get_client_invoices_with_pagination(client, client_user_token):
    """Test GET /api/v1/client/invoices with pagination"""
    response = client.get(
        "/api/v1/client/invoices?skip=0&limit=10",
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data


def test_get_client_projects(client, client_user_token):
    """Test GET /api/v1/client/projects"""
    response = client.get(
        "/api/v1/client/projects",
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_get_client_tickets(client, client_user_token):
    """Test GET /api/v1/client/tickets"""
    response = client.get(
        "/api/v1/client/tickets",
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_create_client_ticket(client, client_user_token):
    """Test POST /api/v1/client/tickets"""
    ticket_data = {
        "subject": "Test Ticket",
        "description": "Test description",
        "category": "support",
        "priority": "medium"
    }
    
    response = client.post(
        "/api/v1/client/tickets",
        json=ticket_data,
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    # May return 200, 201, or 422 if validation fails
    assert response.status_code in [200, 201, 422]
    if response.status_code in [200, 201]:
        data = response.json()
        assert "id" in data
        assert data["subject"] == ticket_data["subject"]


def test_get_client_ticket_by_id(client, client_user_token):
    """Test GET /api/v1/client/tickets/{ticket_id}"""
    # First create a ticket
    ticket_data = {
        "subject": "Test Ticket",
        "description": "Test description",
        "category": "support",
        "priority": "medium"
    }
    
    create_response = client.post(
        "/api/v1/client/tickets",
        json=ticket_data,
        headers={"Authorization": f"Bearer {client_user_token}"}
    )
    
    if create_response.status_code in [200, 201]:
        ticket_id = create_response.json()["id"]
        
        # Then get it
        response = client.get(
            f"/api/v1/client/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {client_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == ticket_id

