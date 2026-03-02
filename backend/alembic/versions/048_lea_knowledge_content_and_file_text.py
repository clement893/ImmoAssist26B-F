"""Add lea_knowledge_content table and content_text to files

Revision ID: 048_lea_knowledge
Revises: 047_lea_tx_links
Create Date: 2026-03-02

- Table lea_knowledge_content: key (PK), content (text), updated_at (for OACIQ and other editable knowledge).
- Column files.content_text: extracted text for knowledge base documents (TXT/MD) used by Léa.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "048_lea_knowledge"
down_revision: Union[str, None] = "047_lea_tx_links"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "lea_knowledge_content",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.add_column("files", sa.Column("content_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("files", "content_text")
    op.drop_table("lea_knowledge_content")
