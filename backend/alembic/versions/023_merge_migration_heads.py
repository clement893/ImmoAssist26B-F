"""Merge migration heads to resolve overlap

Revision ID: 023_merge_migration_heads
Revises: ('012_add_integrations_table', '020_security_audit_logs')
Create Date: 2025-12-28 23:00:00.000000

This migration merges the two detected heads to resolve the overlap error.
The actual chain is linear, but the database may have an inconsistent state.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '023_merge_migration_heads'
down_revision: Union[str, tuple] = ('012_add_integrations_table', '020_security_audit_logs')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration heads - no schema changes needed."""
    # This is a merge migration to resolve the overlap error
    # No actual schema changes are needed as both branches are already applied
    pass


def downgrade() -> None:
    """Downgrade merge migration."""
    # This is a merge migration, so no actual schema changes to revert
    pass
