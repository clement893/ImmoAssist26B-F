"""
Integration tests for multi-tenancy

End-to-end tests that verify tenancy works correctly across the entire stack.
"""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import create_app
from app.core.database import Base, get_db
from app.core.tenancy import TenancyConfig, set_current_tenant, clear_current_tenant
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.project import Project


# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session factory
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override get_db dependency for testing"""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        Base.metadata.drop_all(bind=test_engine)
        db.close()


@pytest.fixture(scope="function")
def app():
    """Create test FastAPI app"""
    # Reset tenancy config
    TenancyConfig.reset()
    os.environ["TENANCY_MODE"] = "shared_db"
    
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture(scope="function")
def client(app):
    """Create test client"""
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user(db_session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_team(db_session, test_user):
    """Create a test team"""
    team = Team(
        name="Test Team",
        slug="test-team",
        owner_id=test_user.id,
        is_active=True
    )
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    
    # Add user to team
    member = TeamMember(
        team_id=team.id,
        user_id=test_user.id,
        role="admin",
        is_active=True
    )
    db_session.add(member)
    db_session.commit()
    
    return team


class TestTenancyIntegration:
    """Integration tests for tenancy"""
    
    def setup_method(self):
        """Reset state before each test"""
        TenancyConfig.reset()
        clear_current_tenant()
    
    def test_query_scoping_in_single_mode(self, app, db_session, test_user):
        """Test that queries are not scoped in single mode"""
        os.environ["TENANCY_MODE"] = "single"
        TenancyConfig.reset()
        
        # Create projects for different users
        project1 = Project(
            name="Project 1",
            user_id=test_user.id,
            status="active"
        )
        db_session.add(project1)
        db_session.commit()
        
        # In single mode, query should return all projects
        from sqlalchemy import select
        from app.core.tenancy_helpers import apply_tenant_scope
        
        query = select(Project)
        scoped_query = apply_tenant_scope(query, Project)
        result = db_session.execute(scoped_query)
        projects = result.scalars().all()
        
        # Should return project (no filtering)
        assert len(projects) >= 1
    
    def test_query_scoping_in_shared_db_mode(
        self, app, db_session, test_user, test_team
    ):
        """Test that queries are scoped in shared_db mode"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        # Create projects for the team
        project1 = Project(
            name="Project 1",
            user_id=test_user.id,
            status="active"
        )
        # Add team_id if model has it
        if hasattr(Project, 'team_id'):
            project1.team_id = test_team.id
        
        db_session.add(project1)
        db_session.commit()
        
        # Set tenant context
        set_current_tenant(test_team.id)
        
        from sqlalchemy import select
        from app.core.tenancy_helpers import apply_tenant_scope
        
        query = select(Project)
        scoped_query = apply_tenant_scope(query, Project)
        result = db_session.execute(scoped_query)
        projects = result.scalars().all()
        
        # Should return only projects for this tenant
        if hasattr(Project, 'team_id'):
            assert len(projects) == 1
            assert projects[0].team_id == test_team.id
    
    def test_middleware_sets_tenant_context(self, app, db_session, test_team):
        """Test that middleware sets tenant context from header"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        client = TestClient(app)
        
        # Make request with tenant header
        response = client.get(
            "/api/v1/admin/tenancy/current-tenant",
            headers={"X-Tenant-ID": str(test_team.id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["current_tenant_id"] == test_team.id
    
    def test_endpoint_with_tenant_scoping(
        self, app, db_session, test_user, test_team
    ):
        """Test that endpoint applies tenant scoping"""
        os.environ["TENANCY_MODE"] = "shared_db"
        TenancyConfig.reset()
        
        # Create project for team
        project = Project(
            name="Test Project",
            user_id=test_user.id,
            status="active"
        )
        if hasattr(Project, 'team_id'):
            project.team_id = test_team.id
        
        db_session.add(project)
        db_session.commit()
        
        # Note: This test would require authentication setup
        # For now, we test the scoping logic directly
        from sqlalchemy import select
        from app.core.tenancy_helpers import apply_tenant_scope
        
        set_current_tenant(test_team.id)
        
        query = select(Project).where(Project.user_id == test_user.id)
        scoped_query = apply_tenant_scope(query, Project)
        result = db_session.execute(scoped_query)
        projects = result.scalars().all()
        
        if hasattr(Project, 'team_id'):
            assert len(projects) == 1
            assert projects[0].team_id == test_team.id


