"""Drop unique constraint on real_estate_contacts.user_id

Revision ID: 046_rec_user_id_unique
Revises: 045_cover_photo_id
Create Date: 2026-03-01

Permet plusieurs contacts real_estate_contacts par utilisateur (liaison contact réseau -> transaction).
"""
from typing import Sequence, Union

from alembic import op


revision: str = "046_rec_user_id_unique"
down_revision: Union[str, None] = "045_cover_photo_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_real_estate_contacts_user_id",
        "real_estate_contacts",
        type_="unique",
    )


def downgrade() -> None:
    op.create_unique_constraint(
        "uq_real_estate_contacts_user_id",
        "real_estate_contacts",
        ["user_id"],
    )
