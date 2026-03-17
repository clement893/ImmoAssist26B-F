"""Tests for file upload endpoints."""

import pytest
from httpx import AsyncClient
from io import BytesIO


@pytest.mark.asyncio
async def test_upload_file_requires_auth(client: AsyncClient):
    """Test upload requires authentication."""
    file_content = b"test file content"
    files = {"file": ("test.txt", BytesIO(file_content), "text/plain")}
    
    response = await client.post("/api/upload/file", files=files)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_files_requires_auth(client: AsyncClient):
    """Test listing files requires authentication."""
    response = await client.get("/api/upload/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_file_requires_auth(client: AsyncClient):
    """Test getting file requires authentication."""
    from uuid import uuid4
    response = await client.get(f"/api/upload/{uuid4()}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_delete_file_requires_auth(client: AsyncClient):
    """Test deleting file requires authentication."""
    from uuid import uuid4
    response = await client.delete(f"/api/upload/{uuid4()}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_files_empty(client: AsyncClient, auth_headers: dict):
    """Test listing files when user has no files."""
    response = await client.get("/api/upload/?skip=0&limit=10", headers=auth_headers)
    # Should return 200 with empty list or 503 if S3 not configured
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_upload_file_no_file_provided(client: AsyncClient, auth_headers: dict):
    """Test upload without file."""
    response = await client.post("/api/upload/file", headers=auth_headers)
    assert response.status_code in [400, 422, 503]  # 503 if S3 not configured


@pytest.mark.asyncio
async def test_upload_file_invalid(client: AsyncClient, auth_headers: dict):
    """Test upload with invalid file."""
    # Upload empty file
    files = {"file": ("", BytesIO(b""), "text/plain")}
    response = await client.post(
        "/api/upload/file",
        files=files,
        headers=auth_headers,
    )
    assert response.status_code in [400, 503]  # 503 if S3 not configured

