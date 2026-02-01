"""Add OCR extraction fields to forms and form_submissions

Revision ID: 040_ocr_extraction
Revises: 039_appointments
Create Date: 2026-02-01

Adds extraction_schema to forms, source_document_url, extraction_confidence, needs_review to form_submissions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "040_ocr_extraction"
down_revision: Union[str, None] = "039_appointments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("forms", sa.Column("extraction_schema", sa.JSON(), nullable=True))
    op.add_column("form_submissions", sa.Column("source_document_url", sa.String(512), nullable=True))
    op.add_column("form_submissions", sa.Column("extraction_confidence", sa.JSON(), nullable=True))
    op.add_column("form_submissions", sa.Column("needs_review", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade() -> None:
    op.drop_column("form_submissions", "needs_review")
    op.drop_column("form_submissions", "extraction_confidence")
    op.drop_column("form_submissions", "source_document_url")
    op.drop_column("forms", "extraction_schema")
