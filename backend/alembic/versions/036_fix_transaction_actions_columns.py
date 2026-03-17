"""Fix transaction actions columns in real_estate_transactions

Revision ID: 036_fix_txn_actions
Revises: 035_create_user_availabilities
Create Date: 2026-02-01 01:15:00.000000

This migration fixes the missing columns in real_estate_transactions table
that should have been added by migration 8c9d0e1f2a3b but were not applied.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '036_fix_txn_actions'
down_revision: Union[str, None] = '035_create_user_availabilities'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def table_exists(table_name: str) -> bool:
    """Check if a table exists"""
    conn = op.get_bind()
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    """Add missing columns to real_estate_transactions if they don't exist"""
    # Check if columns exist before adding them
    if not column_exists('real_estate_transactions', 'current_action_code'):
        op.add_column('real_estate_transactions', 
                     sa.Column('current_action_code', sa.String(length=50), nullable=True))
        print("✓ Added column: current_action_code")
    else:
        print("✓ Column already exists: current_action_code")
    
    if not column_exists('real_estate_transactions', 'last_action_at'):
        op.add_column('real_estate_transactions', 
                     sa.Column('last_action_at', sa.DateTime(timezone=True), nullable=True))
        print("✓ Added column: last_action_at")
    else:
        print("✓ Column already exists: last_action_at")
    
    if not column_exists('real_estate_transactions', 'action_count'):
        op.add_column('real_estate_transactions', 
                     sa.Column('action_count', sa.Integer(), nullable=True, server_default='0'))
        print("✓ Added column: action_count")
    else:
        print("✓ Column already exists: action_count")
    
    # Add foreign key constraint if it doesn't exist
    # Check if foreign key exists
    conn = op.get_bind()
    inspector = inspect(conn)
    fks = inspector.get_foreign_keys('real_estate_transactions')
    fk_exists = any(fk.get('name') == 'fk_transaction_current_action' for fk in fks)
    
    if not fk_exists and table_exists('transaction_actions'):
        op.create_foreign_key(
            'fk_transaction_current_action',
            'real_estate_transactions',
            'transaction_actions',
            ['current_action_code'],
            ['code']
        )
        print("✓ Added foreign key: fk_transaction_current_action")
    else:
        print("✓ Foreign key already exists or transaction_actions table doesn't exist")


def downgrade() -> None:
    """Remove columns from real_estate_transactions"""
    # Drop foreign key first
    conn = op.get_bind()
    inspector = inspect(conn)
    fks = inspector.get_foreign_keys('real_estate_transactions')
    fk_exists = any(fk.get('name') == 'fk_transaction_current_action' for fk in fks)
    
    if fk_exists:
        op.drop_constraint('fk_transaction_current_action', 'real_estate_transactions', type_='foreignkey')
    
    # Drop columns if they exist
    if column_exists('real_estate_transactions', 'action_count'):
        op.drop_column('real_estate_transactions', 'action_count')
    
    if column_exists('real_estate_transactions', 'last_action_at'):
        op.drop_column('real_estate_transactions', 'last_action_at')
    
    if column_exists('real_estate_transactions', 'current_action_code'):
        op.drop_column('real_estate_transactions', 'current_action_code')
