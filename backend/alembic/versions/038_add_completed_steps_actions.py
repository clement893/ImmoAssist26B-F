"""Add completed_steps, completed_actions, transaction_data to real_estate_transactions

Revision ID: 038_add_completed_steps
Revises: 037_portail_client
Create Date: 2026-02-01 20:00:00.000000

Adds JSON columns for guided transaction steps (acheteur/vendeur).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect


revision: str = '038_add_completed_steps'
down_revision: Union[str, None] = '037_portail_client'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    conn = op.get_bind()
    inspector = inspect(conn)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not column_exists('real_estate_transactions', 'completed_steps'):
        op.add_column(
            'real_estate_transactions',
            sa.Column('completed_steps', postgresql.JSON(astext_type=sa.Text()), nullable=True)
        )
    if not column_exists('real_estate_transactions', 'completed_actions'):
        op.add_column(
            'real_estate_transactions',
            sa.Column('completed_actions', postgresql.JSON(astext_type=sa.Text()), nullable=True)
        )
    if not column_exists('real_estate_transactions', 'transaction_data'):
        op.add_column(
            'real_estate_transactions',
            sa.Column('transaction_data', postgresql.JSON(astext_type=sa.Text()), nullable=True)
        )


def downgrade() -> None:
    if column_exists('real_estate_transactions', 'completed_steps'):
        op.drop_column('real_estate_transactions', 'completed_steps')
    if column_exists('real_estate_transactions', 'completed_actions'):
        op.drop_column('real_estate_transactions', 'completed_actions')
    if column_exists('real_estate_transactions', 'transaction_data'):
        op.drop_column('real_estate_transactions', 'transaction_data')
