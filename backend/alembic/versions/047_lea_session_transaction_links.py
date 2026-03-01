"""Add lea_session_transaction_links table

Revision ID: 047_lea_session_transaction_links
Revises: 046_rec_user_id_unique
Create Date: 2026-03-01

Lien entre une session de conversation Léa et une transaction (pour afficher l'historique sur la fiche transaction).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "047_lea_session_transaction_links"
down_revision: Union[str, None] = "046_rec_user_id_unique"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "lea_session_transaction_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.String(length=255), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["real_estate_transactions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "transaction_id", name="uq_lea_session_tx_session_transaction"),
    )
    op.create_index("idx_lea_session_tx_transaction_id", "lea_session_transaction_links", ["transaction_id"])
    op.create_index("idx_lea_session_tx_user_id", "lea_session_transaction_links", ["user_id"])
    op.create_index("idx_lea_session_tx_created_at", "lea_session_transaction_links", ["created_at"])


def downgrade() -> None:
    op.drop_index("idx_lea_session_tx_created_at", table_name="lea_session_transaction_links")
    op.drop_index("idx_lea_session_tx_user_id", table_name="lea_session_transaction_links")
    op.drop_index("idx_lea_session_tx_transaction_id", table_name="lea_session_transaction_links")
    op.drop_table("lea_session_transaction_links")
