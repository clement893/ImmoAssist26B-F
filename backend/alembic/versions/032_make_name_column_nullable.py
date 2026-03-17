"""Make name column nullable in users table

Revision ID: 032_make_name_nullable
Revises: 031_rename_password_hash
Create Date: 2026-01-24 13:29:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '032_make_name_nullable'
down_revision: Union[str, None] = '031_rename_password_hash'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make name column nullable in users table if it exists."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return  # Table doesn't exist, skip this migration
    
    # Check if name column exists
    columns = {col['name']: col for col in inspector.get_columns('users')}
    
    # Make name column nullable if it exists and is not already nullable
    if 'name' in columns and not columns['name']['nullable']:
        # First, set NULL values for rows where name is empty or null
        # Then make the column nullable
        op.execute("""
            UPDATE users 
            SET name = NULL 
            WHERE name IS NULL OR name = ''
        """)
        
        # Make the column nullable
        op.alter_column('users', 'name', nullable=True)


def downgrade() -> None:
    """Make name column NOT NULL again (with a default value)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return
    
    # Check if name column exists
    columns = {col['name']: col for col in inspector.get_columns('users')}
    
    # Set default value for NULL names before making it NOT NULL
    if 'name' in columns and columns['name']['nullable']:
        # Set a default value for NULL names (use email or 'User')
        op.execute("""
            UPDATE users 
            SET name = COALESCE(
                TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))),
                email,
                'User'
            )
            WHERE name IS NULL
        """)
        
        # Make the column NOT NULL again
        op.alter_column('users', 'name', nullable=False)
