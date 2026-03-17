"""Create user availabilities table

Revision ID: 035_create_user_availabilities
Revises: 034_merge_transaction_actions
Create Date: 2026-01-31 12:00:00.000000

This migration creates the user_availabilities table for calendar availability management.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '035_create_user_availabilities'
down_revision: Union[str, None] = '034_merge_transaction_actions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists"""
    conn = op.get_bind()
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def index_exists(table_name: str, index_name: str) -> bool:
    """Check if an index exists"""
    conn = op.get_bind()
    inspector = inspect(conn)
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
    return index_name in indexes


def upgrade() -> None:
    """Create user_availabilities table."""
    # Check if table already exists
    if table_exists('user_availabilities'):
        print("✓ Table user_availabilities already exists, skipping creation")
        return
    
    # Create enum type for day_of_week (check if it exists first)
    connection = op.get_bind()
    result = connection.execute(
        sa.text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dayofweek')")
    ).scalar()
    
    if not result:
        # Enum doesn't exist, create it
        day_of_week_enum = postgresql.ENUM(
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
            name='dayofweek',
            create_type=True
        )
        day_of_week_enum.create(connection, checkfirst=False)
    
    # Use the enum type (it exists now)
    day_of_week_enum = postgresql.ENUM(
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        name='dayofweek',
        create_type=False
    )
    
    # Create user_availabilities table
    op.create_table(
        'user_availabilities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', day_of_week_enum, nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('label', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes (check if they exist first)
    if not index_exists('user_availabilities', 'idx_user_availabilities_user_id'):
        op.create_index('idx_user_availabilities_user_id', 'user_availabilities', ['user_id'])
    if not index_exists('user_availabilities', 'idx_user_availabilities_day_of_week'):
        op.create_index('idx_user_availabilities_day_of_week', 'user_availabilities', ['day_of_week'])
    if not index_exists('user_availabilities', 'idx_user_availabilities_is_active'):
        op.create_index('idx_user_availabilities_is_active', 'user_availabilities', ['is_active'])
    if not index_exists('user_availabilities', 'idx_user_availabilities_user_day'):
        op.create_index('idx_user_availabilities_user_day', 'user_availabilities', ['user_id', 'day_of_week'])


def downgrade() -> None:
    """Drop user_availabilities table."""
    # Only drop if table exists
    if not table_exists('user_availabilities'):
        return
    
    # Drop indexes if they exist
    if index_exists('user_availabilities', 'idx_user_availabilities_user_day'):
        op.drop_index('idx_user_availabilities_user_day', table_name='user_availabilities')
    if index_exists('user_availabilities', 'idx_user_availabilities_is_active'):
        op.drop_index('idx_user_availabilities_is_active', table_name='user_availabilities')
    if index_exists('user_availabilities', 'idx_user_availabilities_day_of_week'):
        op.drop_index('idx_user_availabilities_day_of_week', table_name='user_availabilities')
    if index_exists('user_availabilities', 'idx_user_availabilities_user_id'):
        op.drop_index('idx_user_availabilities_user_id', table_name='user_availabilities')
    
    op.drop_table('user_availabilities')
    
    # Drop enum type
    op.execute("DROP TYPE IF EXISTS dayofweek")
