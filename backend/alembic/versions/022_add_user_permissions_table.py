"""Add user_permissions table for custom user permissions

Revision ID: 022_add_user_permissions
Revises: 021_add_notifications
Create Date: 2025-01-28 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '022_add_user_permissions'
down_revision: Union[str, None] = '021_add_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema - create user_permissions table if it doesn't exist"""
    # Check which tables already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create user_permissions table
    if 'user_permissions' not in tables:
        op.create_table(
            'user_permissions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('permission_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'permission_id', name='idx_user_permissions_unique'),
        )
        
        # Create indexes
        op.create_index('idx_user_permissions_user', 'user_permissions', ['user_id'])
        op.create_index('idx_user_permissions_permission', 'user_permissions', ['permission_id'])
        op.create_index(op.f('ix_user_permissions_id'), 'user_permissions', ['id'], unique=False)
    else:
        # Table exists, check and create indexes if they don't exist
        indexes = [idx['name'] for idx in inspector.get_indexes('user_permissions')]
        
        if 'idx_user_permissions_user' not in indexes:
            op.create_index('idx_user_permissions_user', 'user_permissions', ['user_id'])
        if 'idx_user_permissions_permission' not in indexes:
            op.create_index('idx_user_permissions_permission', 'user_permissions', ['permission_id'])
        if 'ix_user_permissions_id' not in indexes:
            op.create_index(op.f('ix_user_permissions_id'), 'user_permissions', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade database schema - drop user_permissions table"""
    # Drop indexes first
    op.drop_index('ix_user_permissions_id', table_name='user_permissions')
    op.drop_index('idx_user_permissions_permission', table_name='user_permissions')
    op.drop_index('idx_user_permissions_user', table_name='user_permissions')
    
    # Drop table
    op.drop_table('user_permissions')
