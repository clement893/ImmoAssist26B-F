"""Rename password_hash column to hashed_password in users table

Revision ID: 031_rename_password_hash
Revises: 030_add_first_last_name
Create Date: 2026-01-24 13:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '031_rename_password_hash'
down_revision: Union[str, None] = '030_add_first_last_name'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename password_hash column to hashed_password if it exists."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return  # Table doesn't exist, skip this migration
    
    # Check if columns exist
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Rename password_hash to hashed_password if password_hash exists and hashed_password doesn't
    if 'password_hash' in columns and 'hashed_password' not in columns:
        # Use raw SQL for PostgreSQL column rename
        op.execute('ALTER TABLE users RENAME COLUMN password_hash TO hashed_password')
    elif 'password_hash' in columns and 'hashed_password' in columns:
        # Both exist - drop password_hash and keep hashed_password
        op.drop_column('users', 'password_hash')


def downgrade() -> None:
    """Rename hashed_password column back to password_hash."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if users table exists
    tables = inspector.get_table_names()
    if 'users' not in tables:
        return
    
    # Check if columns exist
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Rename hashed_password back to password_hash if hashed_password exists
    if 'hashed_password' in columns and 'password_hash' not in columns:
        # Use raw SQL for PostgreSQL column rename
        op.execute('ALTER TABLE users RENAME COLUMN hashed_password TO password_hash')
