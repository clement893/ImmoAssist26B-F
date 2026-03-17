"""Add property_listings table for Chrome extension imports

Revision ID: 042_property_listings
Revises: 041_compliance_rules
Create Date: 2026-02-01

Table for properties imported from Centris etc. via the ImmoAssist Chrome extension.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "042_property_listings"
down_revision: Union[str, None] = "041_compliance_rules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "property_listings",
        sa.Column("id", sa.Integer(), sa.Identity(always=False, start=1), nullable=False),
        sa.Column("source_url", sa.String(2048), nullable=False),
        sa.Column("source_name", sa.String(255), nullable=False),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("broker_id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["broker_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["transaction_id"], ["real_estate_transactions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_property_listings_broker_id", "property_listings", ["broker_id"], unique=False)
    op.create_index("idx_property_listings_transaction_id", "property_listings", ["transaction_id"], unique=False)
    op.create_index("idx_property_listings_source_url", "property_listings", ["source_url"], unique=True)


def downgrade() -> None:
    op.drop_index("idx_property_listings_source_url", table_name="property_listings")
    op.drop_index("idx_property_listings_transaction_id", table_name="property_listings")
    op.drop_index("idx_property_listings_broker_id", table_name="property_listings")
    op.drop_table("property_listings")
