"""
Role Model
SQLAlchemy model for user roles
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func, Index, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Role(Base):
    """Role model for RBAC"""
    __tablename__ = "roles"
    __table_args__ = (
        Index("idx_roles_name", "name"),
        Index("idx_roles_is_active", "is_active"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL-friendly identifier
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    team_members = relationship("TeamMember", back_populates="role")
    invitations = relationship("Invitation", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name={self.name}, slug={self.slug})>"


class Permission(Base):
    """Permission model for RBAC"""
    __tablename__ = "permissions"
    __table_args__ = (
        Index("idx_permissions_resource", "resource"),
        Index("idx_permissions_action", "action"),
        Index("idx_permissions_resource_action", "resource", "action"),  # Composite index
    )

    id = Column(Integer, primary_key=True, index=True)
    resource = Column(String(100), nullable=False, index=True)  # e.g., "users", "teams", "invoices"
    action = Column(String(50), nullable=False, index=True)  # e.g., "create", "read", "update", "delete"
    name = Column(String(200), unique=True, nullable=False)  # e.g., "users:create"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    user_permissions = relationship("UserPermission", back_populates="permission", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name={self.name})>"


class RolePermission(Base):
    """Many-to-many relationship between roles and permissions"""
    __tablename__ = "role_permissions"
    __table_args__ = (
        Index("idx_role_permissions_role", "role_id"),
        Index("idx_role_permissions_permission", "permission_id"),
        Index("idx_role_permissions_unique", "role_id", "permission_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="role_permissions")

    def __repr__(self) -> str:
        return f"<RolePermission(role_id={self.role_id}, permission_id={self.permission_id})>"


class UserRole(Base):
    """Many-to-many relationship between users and roles"""
    __tablename__ = "user_roles"
    __table_args__ = (
        Index("idx_user_roles_user", "user_id"),
        Index("idx_user_roles_role", "role_id"),
        Index("idx_user_roles_unique", "user_id", "role_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    role = relationship("Role", back_populates="user_roles")
    user = relationship("User", back_populates="roles")

    def __repr__(self) -> str:
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"


class UserPermission(Base):
    """Many-to-many relationship between users and permissions (custom permissions)"""
    __tablename__ = "user_permissions"
    __table_args__ = (
        Index("idx_user_permissions_user", "user_id"),
        Index("idx_user_permissions_permission", "permission_id"),
        Index("idx_user_permissions_unique", "user_id", "permission_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="custom_permissions")
    permission = relationship("Permission", back_populates="user_permissions")

    def __repr__(self) -> str:
        return f"<UserPermission(user_id={self.user_id}, permission_id={self.permission_id})>"
