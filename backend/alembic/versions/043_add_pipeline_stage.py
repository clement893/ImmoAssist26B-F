"""Add pipeline_stage to real_estate_transactions

Revision ID: 043_pipeline_stage
Revises: 042_property_listings
Create Date: 2026-03-01

Étape du pipeline kanban pour la vue transactions (création dossier, promesse d'achat, etc.).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "043_pipeline_stage"
down_revision: Union[str, None] = "042_property_listings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "real_estate_transactions",
        sa.Column("pipeline_stage", sa.String(80), nullable=True, comment="Étape du pipeline kanban"),
    )
    op.create_index(
        "ix_real_estate_transactions_pipeline_stage",
        "real_estate_transactions",
        ["pipeline_stage"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_real_estate_transactions_pipeline_stage", table_name="real_estate_transactions")
    op.drop_column("real_estate_transactions", "pipeline_stage")
