"""
User Model
SQLAlchemy model for users
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email"),  # Already unique, but explicit index
        Index("idx_users_is_active", "is_active"),  # For filtering active users
        Index("idx_users_created_at", "created_at"),  # For sorting by creation date
        Index("idx_users_updated_at", "updated_at"),  # For sorting by update date
    )

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String(100), nullable=True, index=True)  # For search
    last_name = Column(String(100), nullable=True, index=True)  # For search
    avatar = Column(String(500), nullable=True)  # Avatar URL
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    # DEPRECATED: theme_preference column exists in DB but is deprecated
    # Theme management is now handled globally via the theme system
    # Made nullable=True to handle cases where migration hasn't been run yet
    theme_preference = Column(String(20), default='system', nullable=True)  # DEPRECATED: kept for DB compatibility only
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    custom_permissions = relationship("UserPermission", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    owned_teams = relationship("Team", foreign_keys="Team.owner_id", back_populates="owner")
    sent_invitations = relationship("Invitation", foreign_keys="Invitation.invited_by_id", back_populates="invited_by")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_superadmin(self) -> bool:
        """
        Check if user has superadmin role.
        
        NOTE: This property requires the 'roles' relationship to be loaded.
        For better performance, use selectinload(User.roles) when querying users.
        If roles are not loaded, this will return False.
        
        For async contexts, use: await is_superadmin(user, db) from app.dependencies
        """
        if not hasattr(self, 'roles') or not self.roles:
            return False
        
        for user_role in self.roles:
            if hasattr(user_role, 'role') and user_role.role:
                role = user_role.role
                if hasattr(role, 'slug') and role.slug == "superadmin":
                    if hasattr(role, 'is_active') and role.is_active:
                        return True
        return False
    
    @property
    def is_admin(self) -> bool:
        """
        Check if user has admin role (not superadmin).
        
        NOTE: This property requires the 'roles' relationship to be loaded.
        For better performance, use selectinload(User.roles) when querying users.
        If roles are not loaded, this will return False.
        
        Superadmins are automatically considered admins, but this property
        specifically checks for the "admin" role (not "superadmin").
        """
        if not hasattr(self, 'roles') or not self.roles:
            return False
        
        for user_role in self.roles:
            if hasattr(user_role, 'role') and user_role.role:
                role = user_role.role
                if hasattr(role, 'slug') and role.slug == "admin":
                    if hasattr(role, 'is_active') and role.is_active:
                        return True
        return False

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
