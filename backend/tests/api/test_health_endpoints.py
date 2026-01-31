"""
Tests for Health Check Endpoints
Comprehensive tests for deployment health verification
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def mock_db_session():
    """Mock database session"""
    session = AsyncMock(spec=AsyncSession)
    return session


@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    redis_mock = AsyncMock()
    redis_mock.ping = AsyncMock(return_value=True)
    redis_mock.info = AsyncMock(return_value={"redis_version": "7.0.0"})
    return redis_mock


class TestBasicHealthCheck:
    """Tests for basic health check endpoint"""
    
    def test_health_check_success(self, client):
        """Test basic health check returns healthy status"""
        response = client.get("/api/v1/health/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert "environment" in data


class TestReadinessCheck:
    """Tests for readiness check endpoint"""
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    def test_readiness_check_healthy(self, mock_redis_client, mock_session_local, client, mock_db_session, mock_redis):
        """Test readiness check when all components are healthy"""
        # Mock database
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.return_value.scalar.return_value = 1
        
        # Mock Redis
        mock_redis_client.return_value = mock_redis
        
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert "checks" in data
        assert data["checks"]["database"] == "healthy"
        assert data["checks"]["cache"] == "healthy"
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    def test_readiness_check_database_unhealthy(self, mock_redis_client, mock_session_local, client, mock_db_session):
        """Test readiness check when database is unhealthy"""
        # Mock database failure
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.side_effect = Exception("Database connection failed")
        
        # Mock Redis (optional, shouldn't fail readiness)
        mock_redis_client.return_value = None
        
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "not_ready"
        assert "database" in data["detail"]["checks"]
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    def test_readiness_check_cache_not_configured(self, mock_redis_client, mock_session_local, client, mock_db_session):
        """Test readiness check when cache is not configured"""
        # Mock database
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.return_value.scalar.return_value = 1
        
        # Mock Redis not configured
        mock_redis_client.return_value = None
        
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["checks"]["cache"] == "not_configured"


class TestLivenessCheck:
    """Tests for liveness check endpoint"""
    
    def test_liveness_check_success(self, client):
        """Test liveness check returns alive status"""
        response = client.get("/api/v1/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"
        assert "timestamp" in data


class TestStartupCheck:
    """Tests for startup check endpoint"""
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    @patch("app.api.v1.endpoints.health.engine")
    def test_startup_check_healthy(self, mock_engine, mock_redis_client, mock_session_local, client, mock_db_session, mock_redis):
        """Test startup check when all components are healthy"""
        # Mock database
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.return_value.scalar.return_value = "PostgreSQL 16.0"
        
        # Mock engine pool
        mock_pool = MagicMock()
        mock_pool.size.return_value = 5
        mock_pool.checkedout.return_value = 2
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool
        
        # Mock Redis
        mock_redis_client.return_value = mock_redis
        
        response = client.get("/api/v1/health/startup")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "started"
        assert "checks" in data
        assert data["checks"]["database"]["status"] == "healthy"
        assert data["checks"]["cache"]["status"] == "healthy"
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    def test_startup_check_database_unhealthy(self, mock_redis_client, mock_session_local, client, mock_db_session):
        """Test startup check when database is unhealthy"""
        # Mock database failure
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.side_effect = Exception("Database connection failed")
        
        # Mock Redis not configured
        mock_redis_client.return_value = None
        
        response = client.get("/api/v1/health/startup")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "starting"
        assert data["checks"]["database"]["status"] == "unhealthy"


class TestDetailedHealthCheck:
    """Tests for detailed health check endpoint"""
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    @patch("app.api.v1.endpoints.health.engine")
    def test_detailed_health_check_healthy(self, mock_engine, mock_redis_client, mock_session_local, client, mock_db_session, mock_redis):
        """Test detailed health check when all components are healthy"""
        # Mock database
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.return_value.scalar.return_value = "PostgreSQL 16.0"
        mock_db_session.commit = AsyncMock()
        
        # Mock engine pool
        mock_pool = MagicMock()
        mock_pool.size.return_value = 5
        mock_pool.checkedout.return_value = 2
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool
        
        # Mock Redis
        mock_redis_client.return_value = mock_redis
        
        response = client.get("/api/v1/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "components" in data
        assert data["components"]["database"]["status"] == "healthy"
        assert data["components"]["database"]["write_capable"] is True
        assert data["components"]["cache"]["status"] == "healthy"
        assert data["components"]["application"]["status"] == "healthy"
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    @patch("app.api.v1.endpoints.health.engine")
    def test_detailed_health_check_database_unhealthy(self, mock_engine, mock_redis_client, mock_session_local, client, mock_db_session):
        """Test detailed health check when database is unhealthy"""
        # Mock database failure
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.side_effect = Exception("Database connection failed")
        
        # Mock Redis not configured
        mock_redis_client.return_value = None
        
        response = client.get("/api/v1/health/detailed")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["components"]["database"]["status"] == "unhealthy"
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    @patch("app.api.v1.endpoints.health.engine")
    def test_detailed_health_check_cache_unhealthy(self, mock_engine, mock_redis_client, mock_session_local, client, mock_db_session):
        """Test detailed health check when cache is unhealthy but database is healthy"""
        # Mock database
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.return_value.scalar.return_value = "PostgreSQL 16.0"
        mock_db_session.commit = AsyncMock()
        
        # Mock engine pool
        mock_pool = MagicMock()
        mock_pool.size.return_value = 5
        mock_pool.checkedout.return_value = 2
        mock_pool.overflow.return_value = 0
        mock_engine.pool = mock_pool
        
        # Mock Redis failure (should not fail overall health)
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(side_effect=Exception("Redis connection failed"))
        mock_redis_client.return_value = mock_redis
        
        response = client.get("/api/v1/health/detailed")
        # Cache is optional, so should still return 200
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["components"]["cache"]["status"] == "unhealthy"


class TestHealthCheckEdgeCases:
    """Tests for edge cases in health checks"""
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    def test_readiness_check_database_timeout(self, mock_session_local, client):
        """Test readiness check handles database timeout"""
        # Mock database timeout
        mock_session_local.return_value.__aenter__.side_effect = TimeoutError("Database timeout")
        
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 503
    
    @patch("app.api.v1.endpoints.health.AsyncSessionLocal")
    @patch("app.api.v1.endpoints.health.get_redis_client")
    def test_readiness_check_partial_failure(self, mock_redis_client, mock_session_local, client, mock_db_session):
        """Test readiness check with partial component failure"""
        # Database healthy
        mock_session_local.return_value.__aenter__.return_value = mock_db_session
        mock_session_local.return_value.__aexit__.return_value = None
        mock_db_session.execute.return_value.scalar.return_value = 1
        
        # Redis unhealthy but optional
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(side_effect=Exception("Redis error"))
        mock_redis_client.return_value = mock_redis
        
        response = client.get("/api/v1/health/ready")
        # Should still be ready since cache is optional
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["checks"]["database"] == "healthy"

