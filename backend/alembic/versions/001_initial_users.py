"""Initial users table

Revision ID: 001
Revises: 
Create Date: 2025-12-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if users table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'users' not in tables:
        # Create users table
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
            sa.Column('email', sa.String(255), nullable=False, unique=True),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('password_hash', sa.String(255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        )
        
        # Create indexes
        op.create_index('idx_users_email', 'users', ['email'], unique=True)
        op.create_index('idx_users_created_at', 'users', ['created_at'])
    else:
        # Table already exists, check and create indexes if they don't exist
        indexes = [idx['name'] for idx in inspector.get_indexes('users')]
        if 'idx_users_email' not in indexes:
            op.create_index('idx_users_email', 'users', ['email'], unique=True)
        if 'idx_users_created_at' not in indexes:
            op.create_index('idx_users_created_at', 'users', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_users_created_at', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    
    # Drop table
    op.drop_table('users')

