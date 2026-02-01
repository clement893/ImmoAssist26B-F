"""Add compliance_rules to forms

Revision ID: 041_compliance_rules
Revises: 040_ocr_extraction
Create Date: 2026-02-01

Adds compliance_rules JSON column to forms for OACIQ real-time compliance engine.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "041_compliance_rules"
down_revision: Union[str, None] = "040_ocr_extraction"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("forms", sa.Column("compliance_rules", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("forms", "compliance_rules")
