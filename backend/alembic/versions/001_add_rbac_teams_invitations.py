"""Add RBAC, Teams, and Invitations

Revision ID: 003_add_rbac_teams_invitations
Revises: 002_create_themes_table
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '003_add_rbac_teams_invitations'
down_revision: Union[str, None] = '002_create_themes_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check which tables already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create roles table
    if 'roles' not in tables:
        op.create_table(
            'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
        op.create_index('idx_roles_name', 'roles', ['name'])
        op.create_index('idx_roles_slug', 'roles', ['slug'], unique=True)
        op.create_index('idx_roles_is_active', 'roles', ['is_active'])
    else:
        # Table exists, check and create indexes if they don't exist
        indexes = [idx['name'] for idx in inspector.get_indexes('roles')]
        if 'idx_roles_name' not in indexes:
            op.create_index('idx_roles_name', 'roles', ['name'])
        if 'idx_roles_slug' not in indexes:
            op.create_index('idx_roles_slug', 'roles', ['slug'], unique=True)
        if 'idx_roles_is_active' not in indexes:
            op.create_index('idx_roles_is_active', 'roles', ['is_active'])

    # Create permissions table
    if 'permissions' not in tables:
        op.create_table(
            'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resource', sa.String(length=100), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
        op.create_index('idx_permissions_resource', 'permissions', ['resource'])
        op.create_index('idx_permissions_action', 'permissions', ['action'])
        op.create_index('idx_permissions_resource_action', 'permissions', ['resource', 'action'])

    # Create role_permissions table
    if 'role_permissions' not in tables:
        op.create_table(
            'role_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role_id', 'permission_id', name='idx_role_permissions_unique'),
    )
        op.create_index('idx_role_permissions_role', 'role_permissions', ['role_id'])
        op.create_index('idx_role_permissions_permission', 'role_permissions', ['permission_id'])

    # Create user_roles table
    if 'user_roles' not in tables:
        op.create_table(
            'user_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role_id', name='idx_user_roles_unique'),
    )
        op.create_index('idx_user_roles_user', 'user_roles', ['user_id'])
        op.create_index('idx_user_roles_role', 'user_roles', ['role_id'])

    # Create teams table
    if 'teams' not in tables:
        op.create_table(
            'teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('slug', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('settings', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
        op.create_index('idx_teams_name', 'teams', ['name'])
        op.create_index('idx_teams_slug', 'teams', ['slug'], unique=True)
        op.create_index('idx_teams_owner', 'teams', ['owner_id'])
        op.create_index('idx_teams_is_active', 'teams', ['is_active'])

    # Create team_members table
    if 'team_members' not in tables:
        op.create_table(
            'team_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', 'user_id', name='idx_team_members_unique'),
    )
        op.create_index('idx_team_members_team', 'team_members', ['team_id'])
        op.create_index('idx_team_members_user', 'team_members', ['user_id'])
        op.create_index('idx_team_members_role', 'team_members', ['role_id'])

    # Create invitations table
    if 'invitations' not in tables:
        op.create_table(
            'invitations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('token', sa.String(length=64), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('invited_by_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
        op.create_index('idx_invitations_email', 'invitations', ['email'])
        op.create_index('idx_invitations_token', 'invitations', ['token'], unique=True)
        op.create_index('idx_invitations_team', 'invitations', ['team_id'])
        op.create_index('idx_invitations_status', 'invitations', ['status'])
        op.create_index('idx_invitations_expires_at', 'invitations', ['expires_at'])

    # Insert default roles (only if they don't exist)
    if 'roles' in tables:
        # Check if default roles already exist
        result = conn.execute(sa.text("SELECT COUNT(*) FROM roles WHERE slug IN ('admin', 'member', 'viewer')"))
        count = result.scalar()
        if count == 0:
            op.execute("""
                INSERT INTO roles (name, slug, description, is_system, is_active) VALUES
                ('Admin', 'admin', 'Administrator with full access', true, true),
                ('Member', 'member', 'Standard member', true, true),
                ('Viewer', 'viewer', 'Read-only access', true, true)
            """)
    else:
        # Insert default roles
        op.execute("""
            INSERT INTO roles (name, slug, description, is_system, is_active) VALUES
            ('Admin', 'admin', 'Administrator with full access', true, true),
            ('Member', 'member', 'Standard member', true, true),
            ('Viewer', 'viewer', 'Read-only access', true, true)
        """)

    # Insert default permissions (only if they don't exist)
    if 'permissions' in tables:
        # Check if default permissions already exist
        result = conn.execute(sa.text("SELECT COUNT(*) FROM permissions WHERE name LIKE 'users:%' OR name LIKE 'roles:%' OR name LIKE 'teams:%'"))
        count = result.scalar()
        if count == 0:
            op.execute("""
                INSERT INTO permissions (resource, action, name, description) VALUES
                ('users', 'create', 'users:create', 'Create users'),
                ('users', 'read', 'users:read', 'Read users'),
                ('users', 'update', 'users:update', 'Update users'),
                ('users', 'delete', 'users:delete', 'Delete users'),
                ('roles', 'create', 'roles:create', 'Create roles'),
                ('roles', 'read', 'roles:read', 'Read roles'),
                ('roles', 'update', 'roles:update', 'Update roles'),
                ('roles', 'delete', 'roles:delete', 'Delete roles'),
                ('permissions', 'create', 'permissions:create', 'Create permissions'),
                ('permissions', 'read', 'permissions:read', 'Read permissions'),
                ('teams', 'create', 'teams:create', 'Create teams'),
                ('teams', 'read', 'teams:read', 'Read teams'),
                ('teams', 'update', 'teams:update', 'Update teams'),
                ('teams', 'delete', 'teams:delete', 'Delete teams'),
                ('teams', 'members:add', 'teams:members:add', 'Add team members'),
                ('teams', 'members:update', 'teams:members:update', 'Update team members'),
                ('teams', 'members:remove', 'teams:members:remove', 'Remove team members'),
                ('teams', 'invitations:create', 'teams:invitations:create', 'Create team invitations'),
                ('teams', 'invitations:cancel', 'teams:invitations:cancel', 'Cancel team invitations'),
                ('teams', 'invitations:resend', 'teams:invitations:resend', 'Resend team invitations')
            """)
    else:
        # Insert default permissions
        op.execute("""
            INSERT INTO permissions (resource, action, name, description) VALUES
            ('users', 'create', 'users:create', 'Create users'),
            ('users', 'read', 'users:read', 'Read users'),
            ('users', 'update', 'users:update', 'Update users'),
            ('users', 'delete', 'users:delete', 'Delete users'),
            ('roles', 'create', 'roles:create', 'Create roles'),
            ('roles', 'read', 'roles:read', 'Read roles'),
            ('roles', 'update', 'roles:update', 'Update roles'),
            ('roles', 'delete', 'roles:delete', 'Delete roles'),
            ('permissions', 'create', 'permissions:create', 'Create permissions'),
            ('permissions', 'read', 'permissions:read', 'Read permissions'),
            ('teams', 'create', 'teams:create', 'Create teams'),
            ('teams', 'read', 'teams:read', 'Read teams'),
            ('teams', 'update', 'teams:update', 'Update teams'),
            ('teams', 'delete', 'teams:delete', 'Delete teams'),
            ('teams', 'members:add', 'teams:members:add', 'Add team members'),
            ('teams', 'members:update', 'teams:members:update', 'Update team members'),
            ('teams', 'members:remove', 'teams:members:remove', 'Remove team members'),
            ('teams', 'invitations:create', 'teams:invitations:create', 'Create team invitations'),
            ('teams', 'invitations:cancel', 'teams:invitations:cancel', 'Cancel team invitations'),
            ('teams', 'invitations:resend', 'teams:invitations:resend', 'Resend team invitations')
        """)

    # Assign all permissions to admin role (only if not already assigned)
    if 'role_permissions' in tables and 'roles' in tables:
        result = conn.execute(sa.text("SELECT COUNT(*) FROM role_permissions WHERE role_id = 1"))
        count = result.scalar()
        if count == 0:
            op.execute("""
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT 1, id FROM permissions
            """)
    elif 'role_permissions' in tables:
        op.execute("""
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT 1, id FROM permissions
        """)


def downgrade() -> None:
    op.drop_index('idx_invitations_expires_at', table_name='invitations')
    op.drop_index('idx_invitations_status', table_name='invitations')
    op.drop_index('idx_invitations_team', table_name='invitations')
    op.drop_index('idx_invitations_token', table_name='invitations')
    op.drop_index('idx_invitations_email', table_name='invitations')
    op.drop_table('invitations')
    op.drop_index('idx_team_members_role', table_name='team_members')
    op.drop_index('idx_team_members_user', table_name='team_members')
    op.drop_index('idx_team_members_team', table_name='team_members')
    op.drop_table('team_members')
    op.drop_index('idx_teams_is_active', table_name='teams')
    op.drop_index('idx_teams_owner', table_name='teams')
    op.drop_index('idx_teams_slug', table_name='teams')
    op.drop_index('idx_teams_name', table_name='teams')
    op.drop_table('teams')
    op.drop_index('idx_user_roles_role', table_name='user_roles')
    op.drop_index('idx_user_roles_user', table_name='user_roles')
    op.drop_table('user_roles')
    op.drop_index('idx_role_permissions_permission', table_name='role_permissions')
    op.drop_index('idx_role_permissions_role', table_name='role_permissions')
    op.drop_table('role_permissions')
    op.drop_index('idx_permissions_resource_action', table_name='permissions')
    op.drop_index('idx_permissions_action', table_name='permissions')
    op.drop_index('idx_permissions_resource', table_name='permissions')
    op.drop_table('permissions')
    op.drop_index('idx_roles_is_active', table_name='roles')
    op.drop_index('idx_roles_slug', table_name='roles')
    op.drop_index('idx_roles_name', table_name='roles')
    op.drop_table('roles')

