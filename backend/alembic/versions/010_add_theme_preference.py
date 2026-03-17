"""Add theme_preference to users table

Revision ID: 010
Revises: 009_add_webhook_events
Create Date: 2025-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '010_add_theme_preference'
down_revision: Union[str, None] = '009_add_webhook_events'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add theme_preference column to users table if it doesn't exist
    # Check if column exists first to avoid errors if migration is run multiple times
    conn = op.get_bind()
    
    # Check if column exists using raw SQL (works with asyncpg)
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'theme_preference'
    """))
    
    column_exists = result.fetchone() is not None
    
    if not column_exists:
        op.add_column(
            'users',
            sa.Column('theme_preference', sa.String(20), nullable=False, server_default='system')
        )


def downgrade() -> None:
    # Remove theme_preference column
    op.drop_column('users', 'theme_preference')


