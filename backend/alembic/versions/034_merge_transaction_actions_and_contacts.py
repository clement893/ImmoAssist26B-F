"""Merge migration heads: transaction actions and contacts

Revision ID: 034_merge_transaction_actions
Revises: 8c9d0e1f2a3b, d7ba68446070
Create Date: 2026-02-01 00:30:00.000000

This migration merges the transaction actions system migration with the contacts merge migration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '034_merge_transaction_actions'
down_revision: Union[str, tuple] = ('8c9d0e1f2a3b', 'd7ba68446070')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration heads - no schema changes needed."""
    # This is a merge migration to resolve multiple heads
    # Both migrations have already been applied, so no schema changes are needed
    pass


def downgrade() -> None:
    """Downgrade merge migration."""
    pass
