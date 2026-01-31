"""Add avatar column to users table

Revision ID: 024_add_avatar_column
Revises: 022_add_user_permissions
Create Date: 2025-12-28 23:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '024_add_avatar_column'
down_revision: Union[str, None] = '022_add_user_permissions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add avatar column to users table if it doesn't exist."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return  # Table doesn't exist, skip this migration
    
    # Check if avatar column already exists
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'avatar' not in columns:
        op.add_column(
            'users',
            sa.Column('avatar', sa.String(500), nullable=True)
        )


def downgrade() -> None:
    """Remove avatar column from users table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return  # Table doesn't exist, skip
    
    # Check if avatar column exists before dropping
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'avatar' in columns:
        op.drop_column('users', 'avatar')
