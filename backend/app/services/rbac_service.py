"""
RBAC Service
Service for Role-Based Access Control operations
"""

from typing import List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models import User, Role, Permission, RolePermission, UserRole, UserPermission, TeamMember


class RBACService:
    """Service for managing roles and permissions"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_roles(self, user_id: int) -> List[Role]:
        """Get all roles for a user"""
        result = await self.db.execute(
            select(Role)
            .join(UserRole)
            .where(UserRole.user_id == user_id)
            .where(Role.is_active == True)
        )
        return list(result.scalars().all())

    async def get_user_permissions(self, user_id: int) -> Set[str]:
        """
        Get all permissions for a user (from roles + custom permissions).
        
        Custom permissions override role-based permissions.
        Superadmin role grants admin:* permission (all permissions).
        """
        # Check if user has superadmin role (has all permissions)
        has_superadmin = await self.has_role(user_id, "superadmin")
        if has_superadmin:
            return {"admin:*"}
        
        # Get permissions from roles
        role_permissions_result = await self.db.execute(
            select(Permission.name)
            .join(RolePermission)
            .join(Role)
            .join(UserRole)
            .where(UserRole.user_id == user_id)
            .where(Role.is_active == True)
        )
        permissions = set(role_permissions_result.scalars().all())
        
        # Get custom permissions (override role permissions)
        custom_permissions_result = await self.db.execute(
            select(Permission.name)
            .join(UserPermission)
            .where(UserPermission.user_id == user_id)
        )
        custom_permissions = set(custom_permissions_result.scalars().all())
        
        # Combine: custom permissions override role permissions
        permissions.update(custom_permissions)
        
        return permissions

    async def has_permission(self, user_id: int, permission_name: str) -> bool:
        """
        Check if user has a specific permission.
        
        Handles wildcard permissions:
        - admin:* grants all permissions
        - resource:* grants all permissions for that resource
        """
        permissions = await self.get_user_permissions(user_id)
        
        # Check for exact match
        if permission_name in permissions:
            return True
        
        # Check for wildcard permissions
        if "admin:*" in permissions:
            # admin:* grants all permissions
            return True
        
        # Check for resource-level wildcards (e.g., "users:*" grants "users:read", "users:create", etc.)
        if ":" in permission_name:
            resource, action = permission_name.split(":", 1)
            resource_wildcard = f"{resource}:*"
            if resource_wildcard in permissions:
                return True
        
        return False

    async def has_any_permission(self, user_id: int, permission_names: List[str]) -> bool:
        """Check if user has any of the specified permissions"""
        for permission_name in permission_names:
            if await self.has_permission(user_id, permission_name):
                return True
        return False

    async def has_all_permissions(self, user_id: int, permission_names: List[str]) -> bool:
        """Check if user has all of the specified permissions"""
        for permission_name in permission_names:
            if not await self.has_permission(user_id, permission_name):
                return False
        return True

    async def has_role(self, user_id: int, role_slug: str) -> bool:
        """Check if user has a specific role"""
        result = await self.db.execute(
            select(UserRole)
            .join(Role)
            .where(UserRole.user_id == user_id)
            .where(Role.slug == role_slug)
            .where(Role.is_active == True)
        )
        return result.scalar_one_or_none() is not None

    async def has_any_role(self, user_id: int, role_slugs: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        result = await self.db.execute(
            select(UserRole)
            .join(Role)
            .where(UserRole.user_id == user_id)
            .where(Role.slug.in_(role_slugs))
            .where(Role.is_active == True)
        )
        return result.scalar_one_or_none() is not None

    async def assign_role(self, user_id: int, role_id: int) -> UserRole:
        """Assign a role to a user"""
        # Check if already assigned
        existing = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .where(UserRole.role_id == role_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Role already assigned to user")

        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        await self.db.commit()
        await self.db.refresh(user_role)
        return user_role

    async def remove_role(self, user_id: int, role_id: int) -> bool:
        """Remove a role from a user"""
        result = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .where(UserRole.role_id == role_id)
        )
        user_role = result.scalar_one_or_none()
        if not user_role:
            return False

        self.db.delete(user_role)
        await self.db.commit()
        return True

    async def create_role(
        self,
        name: str,
        slug: str,
        description: Optional[str] = None,
        is_system: bool = False,
    ) -> Role:
        """Create a new role"""
        role = Role(
            name=name,
            slug=slug,
            description=description,
            is_system=is_system,
        )
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def create_permission(
        self,
        resource: str,
        action: str,
        description: Optional[str] = None,
    ) -> Permission:
        """Create a new permission"""
        name = f"{resource}:{action}"
        permission = Permission(
            resource=resource,
            action=action,
            name=name,
            description=description,
        )
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission

    async def assign_permission_to_role(self, role_id: int, permission_id: int) -> RolePermission:
        """Assign a permission to a role"""
        # Check if already assigned
        existing = await self.db.execute(
            select(RolePermission)
            .where(RolePermission.role_id == role_id)
            .where(RolePermission.permission_id == permission_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Permission already assigned to role")

        role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
        self.db.add(role_permission)
        await self.db.commit()
        await self.db.refresh(role_permission)
        return role_permission

    async def remove_permission_from_role(self, role_id: int, permission_id: int) -> bool:
        """Remove a permission from a role"""
        result = await self.db.execute(
            select(RolePermission)
            .where(RolePermission.role_id == role_id)
            .where(RolePermission.permission_id == permission_id)
        )
        role_permission = result.scalar_one_or_none()
        if not role_permission:
            return False

        self.db.delete(role_permission)
        await self.db.commit()
        return True

    async def get_role_permissions(self, role_id: int) -> List[Permission]:
        """Get all permissions for a role"""
        result = await self.db.execute(
            select(Permission)
            .join(RolePermission)
            .where(RolePermission.role_id == role_id)
        )
        return list(result.scalars().all())

    async def get_team_user_role(self, user_id: int, team_id: int) -> Optional[Role]:
        """Get user's role in a specific team"""
        result = await self.db.execute(
            select(Role)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_team_user_permissions(self, user_id: int, team_id: int) -> Set[str]:
        """Get user's permissions in a specific team"""
        result = await self.db.execute(
            select(Permission.name)
            .join(RolePermission)
            .join(Role)
            .join(TeamMember)
            .where(TeamMember.user_id == user_id)
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.is_active == True)
            .where(Role.is_active == True)
        )
        return set(result.scalars().all())

    async def has_team_permission(self, user_id: int, team_id: int, permission_name: str) -> bool:
        """Check if user has a specific permission in a team"""
        permissions = await self.get_team_user_permissions(user_id, team_id)
        return permission_name in permissions

    async def seed_default_permissions(self) -> List[Permission]:
        """Seed default permissions in the database"""
        default_permissions = [
            # User permissions
            ("users", "read", "Read user information"),
            ("users", "create", "Create new users"),
            ("users", "update", "Update user information"),
            ("users", "delete", "Delete users"),
            ("users", "list", "List all users"),
            # Role permissions
            ("roles", "read", "Read role information"),
            ("roles", "create", "Create new roles"),
            ("roles", "update", "Update role information"),
            ("roles", "delete", "Delete roles"),
            ("roles", "list", "List all roles"),
            # Permission permissions
            ("permissions", "read", "Read permission information"),
            ("permissions", "create", "Create new permissions"),
            ("permissions", "update", "Update permission information"),
            ("permissions", "delete", "Delete permissions"),
            ("permissions", "list", "List all permissions"),
            # Admin sections permissions
            ("admin", "users", "Access admin users section"),
            ("admin", "invitations", "Access admin invitations section"),
            ("admin", "organizations", "Access admin organizations section"),
            ("admin", "themes", "Access admin themes section"),
            ("admin", "settings", "Access admin settings section"),
            ("admin", "logs", "Access admin logs section"),
            ("admin", "statistics", "Access admin statistics section"),
            ("admin", "rbac", "Access admin RBAC section"),
            ("admin", "teams", "Access admin teams section"),
            ("admin", "tenancy", "Access admin tenancy section"),
            # Admin wildcard (grants all admin permissions)
            ("admin", "*", "All admin permissions"),
        ]
        
        created_permissions = []
        for resource, action, description in default_permissions:
            name = f"{resource}:{action}"
            result = await self.db.execute(select(Permission).where(Permission.name == name))
            existing = result.scalar_one_or_none()
            
            if not existing:
                perm = await self.create_permission(resource, action, description)
                created_permissions.append(perm)
        
        return created_permissions

    async def seed_default_roles(self) -> dict:
        """Seed default roles with their permissions"""
        # First ensure all permissions exist
        await self.seed_default_permissions()
        
        default_roles = [
            {
                "name": "Super Admin",
                "slug": "superadmin",
                "description": "Super administrator with all permissions",
                "is_system": True,
                "permissions": ["admin:*"],  # Superadmin gets admin:* (all permissions)
            },
            {
                "name": "Admin",
                "slug": "admin",
                "description": "Administrator with most permissions",
                "is_system": True,
                "permissions": [
                    "admin:*",  # Admin gets all admin permissions
                    "users:read", "users:create", "users:update", "users:list",
                    "roles:read", "roles:list",
                    "permissions:read", "permissions:list",
                ],
            },
            {
                "name": "Manager",
                "slug": "manager",
                "description": "Manager with team management permissions",
                "is_system": True,
                "permissions": [
                    "admin:users", "admin:teams", "admin:statistics",
                    "users:read", "users:list",
                    "teams:read", "teams:create", "teams:update", "teams:list",
                ],
            },
            {
                "name": "User",
                "slug": "user",
                "description": "Standard user",
                "is_system": True,
                "permissions": [],  # Standard users have no admin permissions
            },
        ]
        
        created_roles = {}
        for role_data in default_roles:
            result = await self.db.execute(select(Role).where(Role.slug == role_data["slug"]))
            existing_role = result.scalar_one_or_none()
            
            if not existing_role:
                role = await self.create_role(
                    name=role_data["name"],
                    slug=role_data["slug"],
                    description=role_data["description"],
                    is_system=role_data["is_system"],
                )
                created_roles[role_data["slug"]] = role
            else:
                created_roles[role_data["slug"]] = existing_role
            
            # Ensure permissions are assigned (even for existing roles)
            for perm_name in role_data["permissions"]:
                perm_result = await self.db.execute(select(Permission).where(Permission.name == perm_name))
                perm = perm_result.scalar_one_or_none()
                
                if perm:
                    # Check if already assigned
                    from app.models import RolePermission
                    rp_result = await self.db.execute(
                        select(RolePermission)
                        .where(RolePermission.role_id == created_roles[role_data["slug"]].id)
                        .where(RolePermission.permission_id == perm.id)
                    )
                    if not rp_result.scalar_one_or_none():
                        try:
                            await self.assign_permission_to_role(created_roles[role_data["slug"]].id, perm.id)
                        except ValueError:
                            pass  # Already assigned
        
        return created_roles

    async def seed_default_data(self) -> dict:
        """Seed all default RBAC data (permissions and roles)"""
        permissions = await self.seed_default_permissions()
        roles = await self.seed_default_roles()
        
        return {
            "permissions": permissions,
            "roles": roles,
        }
