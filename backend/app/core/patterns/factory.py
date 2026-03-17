"""
Factory Pattern Implementation

Provides factory classes for creating objects with complex initialization logic.
Supports dependency injection and flexible object creation.

@example
```python
from app.core.patterns.factory import UserFactory, ProjectFactory

# Create user with factory
user = UserFactory.create(
    email="test@example.com",
    password="password123",
    role="admin"
)

# Create project with factory
project = ProjectFactory.create(
    name="My Project",
    owner_id=user.id,
    settings={"theme": "dark"}
)
```
"""

from typing import Dict, Any, Optional, Type, TypeVar
from abc import ABC, abstractmethod

T = TypeVar('T')


class Factory(ABC):
    """Base factory class for creating objects"""
    
    @abstractmethod
    def create(self, **kwargs) -> Any:
        """Create an object instance"""
        pass
    
    @abstractmethod
    def validate(self, **kwargs) -> bool:
        """Validate creation parameters"""
        pass


class UserFactory(Factory):
    """Factory for creating User objects"""
    
    @staticmethod
    def create(
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        is_active: bool = True,
        is_superuser: bool = False,
        **extra_fields
    ):
        """
        Create a User instance.
        
        @param email - User email address
        @param password - Plain text password (will be hashed)
        @param first_name - User first name
        @param last_name - User last name
        @param is_active - Whether user is active
        @param is_superuser - Whether user is superuser
        @param extra_fields - Additional fields to set
        @returns User instance
        
        @example
        ```python
        user = UserFactory.create(
            email="test@example.com",
            password="secure123",
            first_name="John",
            last_name="Doe"
        )
        ```
        """
        from app.models.user import User
        from app.core.auth import get_password_hash
        
        # Validate
        if not UserFactory.validate(email=email, password=password):
            raise ValueError("Invalid user creation parameters")
        
        # Hash password
        password_hash = get_password_hash(password)
        
        # Create user
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            is_active=is_active,
            is_superuser=is_superuser,
            **extra_fields
        )
        
        return user
    
    @staticmethod
    def validate(email: str, password: str) -> bool:
        """Validate user creation parameters"""
        if not email or "@" not in email:
            return False
        if not password or len(password) < 8:
            return False
        return True


class ProjectFactory(Factory):
    """Factory for creating Project objects"""
    
    @staticmethod
    def create(
        name: str,
        owner_id: int,
        description: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None,
        **extra_fields
    ):
        """
        Create a Project instance.
        
        @param name - Project name
        @param owner_id - Owner user ID
        @param description - Project description
        @param settings - Project settings dictionary
        @param extra_fields - Additional fields to set
        @returns Project instance
        """
        from app.models.project import Project
        
        # Validate
        if not ProjectFactory.validate(name=name, owner_id=owner_id):
            raise ValueError("Invalid project creation parameters")
        
        # Create project
        project = Project(
            name=name,
            owner_id=owner_id,
            description=description,
            settings=settings or {},
            **extra_fields
        )
        
        return project
    
    @staticmethod
    def validate(name: str, owner_id: int) -> bool:
        """Validate project creation parameters"""
        if not name or len(name.strip()) == 0:
            return False
        if not owner_id or owner_id <= 0:
            return False
        return True


class ServiceFactory:
    """Factory for creating service instances with dependency injection"""
    
    _instances: Dict[str, Any] = {}
    
    @staticmethod
    def get_service(service_class: Type[T], **dependencies) -> T:
        """
        Get or create a service instance (Singleton pattern).
        
        @param service_class - Service class to instantiate
        @param dependencies - Dependencies to inject
        @returns Service instance
        
        @example
        ```python
        email_service = ServiceFactory.get_service(
            EmailService,
            sendgrid_client=sendgrid_client
        )
        ```
        """
        service_name = service_class.__name__
        
        if service_name not in ServiceFactory._instances:
            ServiceFactory._instances[service_name] = service_class(**dependencies)
        
        return ServiceFactory._instances[service_name]
    
    @staticmethod
    def reset():
        """Reset all service instances (useful for testing)"""
        ServiceFactory._instances.clear()

