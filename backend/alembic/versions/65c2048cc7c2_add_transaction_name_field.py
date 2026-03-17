"""add_transaction_name_field

Revision ID: 65c2048cc7c2
Revises: 4ef61c3e1e3b
Create Date: 2026-01-31 17:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '65c2048cc7c2'
down_revision: Union[str, None] = '4ef61c3e1e3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add name column (required)
    op.add_column('real_estate_transactions', sa.Column('name', sa.String(), nullable=True))
    
    # Set default name for existing records
    op.execute("UPDATE real_estate_transactions SET name = COALESCE(dossier_number, 'Transaction ' || id::text) WHERE name IS NULL")
    
    # Make name NOT NULL
    op.alter_column('real_estate_transactions', 'name', nullable=False)
    
    # Make dossier_number nullable and remove unique constraint temporarily
    op.drop_index('ix_real_estate_transactions_dossier_number', table_name='real_estate_transactions')
    op.alter_column('real_estate_transactions', 'dossier_number', nullable=True)
    
    # Recreate unique index only for non-null values
    op.create_index(
        'ix_real_estate_transactions_dossier_number',
        'real_estate_transactions',
        ['dossier_number'],
        unique=True,
        postgresql_where=sa.text('dossier_number IS NOT NULL')
    )


def downgrade() -> None:
    # Remove unique index
    op.drop_index('ix_real_estate_transactions_dossier_number', table_name='real_estate_transactions')
    
    # Make dossier_number NOT NULL again (will fail if there are NULL values)
    op.alter_column('real_estate_transactions', 'dossier_number', nullable=False)
    
    # Recreate unique index
    op.create_index('ix_real_estate_transactions_dossier_number', 'real_estate_transactions', ['dossier_number'], unique=True)
    
    # Remove name column
    op.drop_column('real_estate_transactions', 'name')
