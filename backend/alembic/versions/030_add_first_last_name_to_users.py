"""Add first_name and last_name columns to users table

Revision ID: 030_add_first_last_name
Revises: 029
Create Date: 2026-01-24 13:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '030_add_first_last_name'
down_revision: Union[str, None] = '029'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add first_name and last_name columns to users table if they don't exist."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return  # Table doesn't exist, skip this migration
    
    # Check if columns already exist
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Add first_name column if it doesn't exist
    if 'first_name' not in columns:
        op.add_column(
            'users',
            sa.Column('first_name', sa.String(length=100), nullable=True)
        )
    
    # Add last_name column if it doesn't exist
    if 'last_name' not in columns:
        op.add_column(
            'users',
            sa.Column('last_name', sa.String(length=100), nullable=True)
        )
    
    # Migrate data from 'name' column to first_name/last_name if name exists
    # Only migrate if we just added the columns (they didn't exist before)
    if 'name' in columns:
        # Check if we need to migrate (only if name has data and first_name/last_name are empty)
        result = conn.execute(sa.text("""
            SELECT COUNT(*) 
            FROM users 
            WHERE name IS NOT NULL AND name != '' 
            AND (first_name IS NULL OR last_name IS NULL)
        """))
        needs_migration = result.scalar() > 0
        
        if needs_migration:
            # Split existing 'name' column into first_name and last_name
            op.execute("""
                UPDATE users 
                SET first_name = SPLIT_PART(name, ' ', 1),
                    last_name = CASE 
                        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
                        ELSE NULL
                    END
                WHERE name IS NOT NULL AND name != ''
                AND (first_name IS NULL OR last_name IS NULL)
            """)


def downgrade() -> None:
    """Remove first_name and last_name columns from users table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return
    
    # Check if columns exist before dropping
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'last_name' in columns:
        op.drop_column('users', 'last_name')
    
    if 'first_name' in columns:
        op.drop_column('users', 'first_name')
