"""add_documents_field_to_transactions

Revision ID: 66a1b2c3d4e5
Revises: 65c2048cc7c2
Create Date: 2026-01-31 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '66a1b2c3d4e5'
down_revision: Union[str, None] = '65c2048cc7c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add documents column as JSON
    op.add_column('real_estate_transactions', sa.Column('documents', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove documents column
    op.drop_column('real_estate_transactions', 'documents')
