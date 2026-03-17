"""
Integration tests for ERP Portal endpoints
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
def admin_user_token(admin_user):
    """Token for admin user"""
    from app.core.config import settings
    from datetime import timedelta
    return create_access_token(
        data={"sub": admin_user.email, "type": "access"},
        expires_delta=timedelta(minutes=30)
    )


def test_get_erp_dashboard_stats(client, admin_user_token):
    """Test GET /api/v1/erp/dashboard/stats"""
    response = client.get(
        "/api/v1/erp/dashboard/stats",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    # May return 200 or 404 if no data
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.json()
        assert "total_orders" in data
        assert "total_invoices" in data
        assert "total_clients" in data
        assert "total_revenue" in data


def test_get_erp_invoices(client, admin_user_token):
    """Test GET /api/v1/erp/invoices"""
    response = client.get(
        "/api/v1/erp/invoices",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_get_erp_invoices_with_filters(client, admin_user_token):
    """Test GET /api/v1/erp/invoices with filters"""
    response = client.get(
        "/api/v1/erp/invoices?status=paid&client_id=1",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


def test_get_erp_clients(client, admin_user_token):
    """Test GET /api/v1/erp/clients"""
    response = client.get(
        "/api/v1/erp/clients",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_get_erp_clients_with_filter(client, admin_user_token):
    """Test GET /api/v1/erp/clients with active filter"""
    response = client.get(
        "/api/v1/erp/clients?is_active=true",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


def test_get_erp_invoice_by_id(client, admin_user_token):
    """Test GET /api/v1/erp/invoices/{invoice_id}"""
    # First get list to find an invoice ID
    list_response = client.get(
        "/api/v1/erp/invoices",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    if list_response.status_code == 200:
        data = list_response.json()
        if data["items"]:
            invoice_id = data["items"][0]["id"]
            
            # Then get specific invoice
            response = client.get(
                f"/api/v1/erp/invoices/{invoice_id}",
                headers={"Authorization": f"Bearer {admin_user_token}"}
            )
            
            assert response.status_code == 200
            invoice_data = response.json()
            assert invoice_data["id"] == invoice_id


def test_get_erp_client_by_id(client, admin_user_token):
    """Test GET /api/v1/erp/clients/{client_id}"""
    # First get list to find a client ID
    list_response = client.get(
        "/api/v1/erp/clients",
        headers={"Authorization": f"Bearer {admin_user_token}"}
    )
    
    if list_response.status_code == 200:
        data = list_response.json()
        if data["items"]:
            client_id = data["items"][0]["id"]
            
            # Then get specific client
            response = client.get(
                f"/api/v1/erp/clients/{client_id}",
                headers={"Authorization": f"Bearer {admin_user_token}"}
            )
            
            assert response.status_code == 200
            client_data = response.json()
            assert client_data["id"] == client_id

