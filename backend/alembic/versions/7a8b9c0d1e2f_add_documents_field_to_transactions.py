"""add_documents_field_to_transactions

Revision ID: 7a8b9c0d1e2f
Revises: 66a1b2c3d4e5
Create Date: 2026-01-31 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7a8b9c0d1e2f'
down_revision: Union[str, None] = '66a1b2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add documents column as JSON (only if it doesn't exist)
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name'] for col in inspector.get_columns('real_estate_transactions')}
    
    if 'documents' not in existing_columns:
        op.add_column('real_estate_transactions', sa.Column('documents', postgresql.JSON(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Remove documents column (only if it exists)
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name'] for col in inspector.get_columns('real_estate_transactions')}
    
    if 'documents' in existing_columns:
        op.drop_column('real_estate_transactions', 'documents')
