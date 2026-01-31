"""
RBAC Schemas
Pydantic schemas for roles and permissions
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class PermissionBase(BaseModel):
    """Base permission schema"""
    resource: str = Field(..., description="Resource name (e.g., 'users', 'teams')")
    action: str = Field(..., description="Action name (e.g., 'create', 'read', 'update', 'delete')")
    description: Optional[str] = Field(None, description="Permission description")


class PermissionCreate(PermissionBase):
    """Schema for creating a permission"""
    pass


class PermissionResponse(PermissionBase):
    """Schema for permission response"""
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RoleBase(BaseModel):
    """Base role schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Role name")
    slug: str = Field(..., min_length=1, max_length=100, description="URL-friendly identifier")
    description: Optional[str] = Field(None, description="Role description")
    is_system: bool = Field(False, description="System role (cannot be deleted)")

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug format"""
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Slug must contain only alphanumeric characters, hyphens, and underscores")
        return v.lower()


class RoleCreate(RoleBase):
    """Schema for creating a role"""
    pass


class RoleUpdate(BaseModel):
    """Schema for updating a role"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleResponse(RoleBase):
    """Schema for role response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionResponse] = []

    model_config = {"from_attributes": True}


class RolePermissionAssign(BaseModel):
    """Schema for assigning permission to role"""
    permission_id: int


class UserRoleAssign(BaseModel):
    """Schema for assigning role to user"""
    role_id: int


class UserRoleResponse(BaseModel):
    """Schema for user role response"""
    id: int
    user_id: int
    role_id: int
    role: RoleResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class PermissionCheckRequest(BaseModel):
    """Schema for checking permissions"""
    permission: str = Field(..., description="Permission name (e.g., 'users:create')")
    require_all: bool = Field(False, description="Require all permissions if multiple")


class PermissionCheckResponse(BaseModel):
    """Schema for permission check response"""
    has_permission: bool
    user_id: int
    permission: str
    roles: List[str] = []


class RoleListResponse(BaseModel):
    """Schema for role list response"""
    roles: List[RoleResponse]
    total: int


class UserPermissionCreate(BaseModel):
    """Schema for creating a custom user permission"""
    permission_id: int = Field(..., description="ID of the permission to assign")


class UserPermissionResponse(BaseModel):
    """Schema for user permission response"""
    id: int
    user_id: int
    permission_id: int
    permission: PermissionResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkRoleUpdate(BaseModel):
    """Schema for bulk updating user roles"""
    role_ids: List[int] = Field(..., description="List of role IDs to assign to the user")


class BulkPermissionUpdate(BaseModel):
    """Schema for bulk updating role permissions"""
    permission_ids: List[int] = Field(..., description="List of permission IDs to assign to the role")
