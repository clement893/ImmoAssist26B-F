"""Add cover_photo_id to real_estate_transactions

Revision ID: 045_cover_photo_id
Revises: 044_transaction_kind
Create Date: 2026-03-01

Photo à la une : ID du document (photo) affiché en couverture.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "045_cover_photo_id"
down_revision: Union[str, None] = "044_transaction_kind"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "real_estate_transactions",
        sa.Column("cover_photo_id", sa.Integer(), nullable=True, comment="ID du document (photo) utilisé comme photo à la une"),
    )


def downgrade() -> None:
    op.drop_column("real_estate_transactions", "cover_photo_id")
