"""
Tests for Forms API endpoints
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.form import Form, FormSubmission
from app.models.user import User


def test_create_form(client: TestClient, test_user: User, db: AsyncSession):
    """Test creating a new form"""
    form_data = {
        "name": "Test Form",
        "description": "Test form description",
        "fields": [
            {
                "id": "field-1",
                "type": "text",
                "label": "Name",
                "name": "name",
                "required": True,
            }
        ],
        "submit_button_text": "Submit",
    }
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        "/api/v1/forms",
        json=form_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == form_data["name"]
    assert len(data["fields"]) == 1


@pytest.mark.asyncio
async def test_get_form(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting a form by ID"""
    # Create a test form
    form = Form(
        name="Test Form",
        description="Test description",
        fields=[{"id": "field-1", "type": "text", "label": "Name", "name": "name"}],
        submit_button_text="Submit",
        user_id=test_user.id,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        f"/api/v1/forms/{form.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == form.id
    assert data["name"] == "Test Form"


@pytest.mark.asyncio
async def test_list_forms(client: TestClient, test_user: User, db: AsyncSession):
    """Test listing forms"""
    # Create test forms
    for i in range(3):
        form = Form(
            name=f"Test Form {i}",
            fields=[],
            user_id=test_user.id,
        )
        db.add(form)
    await db.commit()
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        "/api/v1/forms",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


@pytest.mark.asyncio
async def test_submit_form(client: TestClient, test_user: User, db: AsyncSession):
    """Test submitting a form"""
    # Create a test form
    form = Form(
        name="Test Form",
        fields=[{"id": "field-1", "type": "text", "label": "Name", "name": "name"}],
        user_id=test_user.id,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    
    submission_data = {
        "form_id": form.id,
        "data": {"name": "John Doe"},
    }
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.post(
        f"/api/v1/forms/{form.id}/submissions",
        json=submission_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["form_id"] == form.id
    assert data["data"]["name"] == "John Doe"


@pytest.mark.asyncio
async def test_get_form_submissions(client: TestClient, test_user: User, db: AsyncSession):
    """Test getting form submissions"""
    # Create a test form
    form = Form(
        name="Test Form",
        fields=[],
        user_id=test_user.id,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    
    # Create test submissions
    for i in range(2):
        submission = FormSubmission(
            form_id=form.id,
            data={"value": f"test-{i}"},
            user_id=test_user.id,
        )
        db.add(submission)
    await db.commit()
    
    token = create_access_token({"sub": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get(
        f"/api/v1/forms/{form.id}/submissions",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

