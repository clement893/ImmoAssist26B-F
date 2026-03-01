"""Add transaction_kind (vente/achat) to real_estate_transactions

Revision ID: 044_transaction_kind
Revises: 043_pipeline_stage
Create Date: 2026-03-01

Type de pipeline : vente (mandat vente) ou achat (mandat achat).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "044_transaction_kind"
down_revision: Union[str, None] = "043_pipeline_stage"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "real_estate_transactions",
        sa.Column("transaction_kind", sa.String(20), nullable=True, comment="Type de pipeline: vente, achat"),
    )
    op.create_index(
        "ix_real_estate_transactions_transaction_kind",
        "real_estate_transactions",
        ["transaction_kind"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_real_estate_transactions_transaction_kind", table_name="real_estate_transactions")
    op.drop_column("real_estate_transactions", "transaction_kind")
