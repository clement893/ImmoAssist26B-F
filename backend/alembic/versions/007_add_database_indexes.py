"""Add database indexes for query optimization

Revision ID: 007_add_indexes
Revises: 003
Create Date: 2025-12-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '007_add_indexes'
down_revision = '005_create_files_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Add indexes to users table (check if they exist first)
    users_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
    
    if 'idx_users_is_active' not in users_indexes:
        op.create_index('idx_users_is_active', 'users', ['is_active'], unique=False)
    if 'idx_users_created_at' not in users_indexes:
        op.create_index('idx_users_created_at', 'users', ['created_at'], unique=False)
    if 'idx_users_updated_at' not in users_indexes:
        op.create_index('idx_users_updated_at', 'users', ['updated_at'], unique=False)
    
    # Check if columns exist before creating indexes on them
    users_columns = {col['name'] for col in inspector.get_columns('users')}
    if 'first_name' in users_columns and 'idx_users_first_name' not in users_indexes:
        op.create_index('idx_users_first_name', 'users', ['first_name'], unique=False)
    if 'last_name' in users_columns and 'idx_users_last_name' not in users_indexes:
        op.create_index('idx_users_last_name', 'users', ['last_name'], unique=False)
    
    # Add composite index for common queries (active users sorted by creation date)
    if 'idx_users_active_created' not in users_indexes:
        op.create_index('idx_users_active_created', 'users', ['is_active', 'created_at'], unique=False)
    
    # Add indexes to organizations table if it exists
    tables = inspector.get_table_names()
    if 'organizations' in tables:
        org_indexes = {idx['name'] for idx in inspector.get_indexes('organizations')}
        if 'idx_organizations_name' not in org_indexes:
            op.create_index('idx_organizations_name', 'organizations', ['name'], unique=False)
        if 'idx_organizations_is_active' not in org_indexes:
            op.create_index('idx_organizations_is_active', 'organizations', ['is_active'], unique=False)
        if 'idx_organizations_created_at' not in org_indexes:
            op.create_index('idx_organizations_created_at', 'organizations', ['created_at'], unique=False)
    
    # Add indexes to organization_members table if it exists
    if 'organization_members' in tables:
        org_members_indexes = {idx['name'] for idx in inspector.get_indexes('organization_members')}
        if 'idx_org_members_user_id' not in org_members_indexes:
            op.create_index('idx_org_members_user_id', 'organization_members', ['user_id'], unique=False)
        if 'idx_org_members_org_id' not in org_members_indexes:
            op.create_index('idx_org_members_org_id', 'organization_members', ['organization_id'], unique=False)
        if 'idx_org_members_role' not in org_members_indexes:
            op.create_index('idx_org_members_role', 'organization_members', ['role'], unique=False)
        # Composite index for common query: get user's organizations
        if 'idx_org_members_user_active' not in org_members_indexes:
            org_members_columns = {col['name'] for col in inspector.get_columns('organization_members')}
            if 'is_active' in org_members_columns:
                op.create_index('idx_org_members_user_active', 'organization_members', ['user_id', 'is_active'], unique=False)
    
    # Add indexes to donateurs table if it exists
    if 'donateurs' in tables:
        donateurs_indexes = {idx['name'] for idx in inspector.get_indexes('donateurs')}
        if 'idx_donateurs_email' not in donateurs_indexes:
            op.create_index('idx_donateurs_email', 'donateurs', ['email'], unique=False)
        if 'idx_donateurs_org_id' not in donateurs_indexes:
            op.create_index('idx_donateurs_org_id', 'donateurs', ['organization_id'], unique=False)
        if 'idx_donateurs_is_active' not in donateurs_indexes:
            op.create_index('idx_donateurs_is_active', 'donateurs', ['is_active'], unique=False)
        if 'idx_donateurs_created_at' not in donateurs_indexes:
            op.create_index('idx_donateurs_created_at', 'donateurs', ['created_at'], unique=False)
        if 'idx_donateurs_segment' not in donateurs_indexes:
            donateurs_columns = {col['name'] for col in inspector.get_columns('donateurs')}
            if 'segment' in donateurs_columns:
                op.create_index('idx_donateurs_segment', 'donateurs', ['segment'], unique=False)
        # Composite index for common query: active donateurs by organization
        if 'idx_donateurs_org_active' not in donateurs_indexes:
            op.create_index('idx_donateurs_org_active', 'donateurs', ['organization_id', 'is_active'], unique=False)
    
    # Add indexes to donations table if it exists
    if 'donations' in tables:
        donations_indexes = {idx['name'] for idx in inspector.get_indexes('donations')}
        if 'idx_donations_donateur_id' not in donations_indexes:
            op.create_index('idx_donations_donateur_id', 'donations', ['donateur_id'], unique=False)
        if 'idx_donations_org_id' not in donations_indexes:
            op.create_index('idx_donations_org_id', 'donations', ['organization_id'], unique=False)
        if 'idx_donations_status' not in donations_indexes:
            op.create_index('idx_donations_status', 'donations', ['payment_status'], unique=False)
        if 'idx_donations_date' not in donations_indexes:
            op.create_index('idx_donations_date', 'donations', ['donation_date'], unique=False)
        # Composite index for common query: completed donations by date
        if 'idx_donations_status_date' not in donations_indexes:
            op.create_index('idx_donations_status_date', 'donations', ['payment_status', 'donation_date'], unique=False)


def downgrade() -> None:
    # Remove indexes
    try:
        op.drop_index('idx_users_active_created', table_name='users')
        op.drop_index('idx_users_last_name', table_name='users')
        op.drop_index('idx_users_first_name', table_name='users')
        op.drop_index('idx_users_updated_at', table_name='users')
        op.drop_index('idx_users_created_at', table_name='users')
        op.drop_index('idx_users_is_active', table_name='users')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_organizations_created_at', table_name='organizations')
        op.drop_index('idx_organizations_is_active', table_name='organizations')
        op.drop_index('idx_organizations_name', table_name='organizations')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_org_members_user_active', table_name='organization_members')
        op.drop_index('idx_org_members_role', table_name='organization_members')
        op.drop_index('idx_org_members_org_id', table_name='organization_members')
        op.drop_index('idx_org_members_user_id', table_name='organization_members')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_donateurs_org_active', table_name='donateurs')
        op.drop_index('idx_donateurs_segment', table_name='donateurs')
        op.drop_index('idx_donateurs_created_at', table_name='donateurs')
        op.drop_index('idx_donateurs_is_active', table_name='donateurs')
        op.drop_index('idx_donateurs_org_id', table_name='donateurs')
        op.drop_index('idx_donateurs_email', table_name='donateurs')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_donations_status_date', table_name='donations')
        op.drop_index('idx_donations_date', table_name='donations')
        op.drop_index('idx_donations_status', table_name='donations')
        op.drop_index('idx_donations_org_id', table_name='donations')
        op.drop_index('idx_donations_donateur_id', table_name='donations')
    except Exception:
        pass

