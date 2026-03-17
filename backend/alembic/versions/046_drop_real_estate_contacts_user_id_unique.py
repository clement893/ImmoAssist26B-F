"""Drop unique constraint on real_estate_contacts.user_id

Revision ID: 046_rec_user_id_unique
Revises: 045_cover_photo_id
Create Date: 2026-03-01

Permet plusieurs contacts real_estate_contacts par utilisateur (liaison contact réseau -> transaction).
Idempotent: ne fait rien si la contrainte n'existe pas (ex: DB déjà migrée autrement).
"""
from typing import Sequence, Union

from alembic import op


revision: str = "046_rec_user_id_unique"
down_revision: Union[str, None] = "045_cover_photo_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop only if exists so migration works whether constraint was ever created or not
    op.execute(
        "ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS uq_real_estate_contacts_user_id"
    )


def downgrade() -> None:
    # Recreate only if it doesn't exist (avoid duplicate constraint on re-downgrade)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'uq_real_estate_contacts_user_id'
                AND conrelid = 'real_estate_contacts'::regclass
            ) THEN
                ALTER TABLE real_estate_contacts
                ADD CONSTRAINT uq_real_estate_contacts_user_id UNIQUE (user_id);
            END IF;
        END $$;
    """)
