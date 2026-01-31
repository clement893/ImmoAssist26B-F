"""Add OAuth fields to users table

Revision ID: 004_add_oauth_fields
Revises: 003_add_rbac_teams_invitations
Create Date: 2025-12-21 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '004_add_oauth_fields'
down_revision: Union[str, None] = '003_add_rbac_teams_invitations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if users table exists and has password_hash column
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'users' not in tables:
        return  # Table doesn't exist, skip this migration
    
    # Check if password_hash column exists
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'password_hash' in columns:
        # Make password_hash nullable for OAuth users
        op.alter_column('users', 'password_hash', nullable=True)
    
    # Add OAuth fields (only if they don't exist)
    if 'provider' not in columns:
        op.add_column('users', sa.Column('provider', sa.String(50), nullable=True))
    if 'provider_id' not in columns:
        op.add_column('users', sa.Column('provider_id', sa.String(255), nullable=True))
    
    # Create index on provider_id for faster lookups (only if it doesn't exist)
    indexes = [idx['name'] for idx in inspector.get_indexes('users')]
    if 'idx_users_provider_id' not in indexes:
        op.create_index('idx_users_provider_id', 'users', ['provider_id'])


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_users_provider_id', table_name='users')
    
    # Remove OAuth columns
    op.drop_column('users', 'provider_id')
    op.drop_column('users', 'provider')
    
    # Note: password_hash remains nullable to avoid data loss
    # If you need to make it required, update existing OAuth users first

