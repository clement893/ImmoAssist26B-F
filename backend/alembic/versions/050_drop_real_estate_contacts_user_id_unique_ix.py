"""Drop any unique constraint on real_estate_contacts.user_id (ix_ and uq_ names)

Revision ID: 050_rec_user_id_unique_ix
Revises: 049_pa_form_fields
Create Date: 2026-03-06

Production fails with: duplicate key value violates unique constraint "ix_real_estate_contacts_user_id".
Migration 046 only drops uq_real_estate_contacts_user_id; some DBs use ix_real_estate_contacts_user_id.
This migration drops both constraint names and the index if created as standalone unique index,
so multiple contacts per user (sellers/buyers) work.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "050_rec_user_id_unique_ix"
down_revision: Union[str, None] = "049_pa_form_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop all possible names for the unique constraint on user_id (idempotent)
    op.execute(
        "ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS uq_real_estate_contacts_user_id"
    )
    op.execute(
        "ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS ix_real_estate_contacts_user_id"
    )
    # If the unique was created as a standalone unique index (no constraint name), drop it
    op.execute(
        "DROP INDEX IF EXISTS ix_real_estate_contacts_user_id"
    )


def downgrade() -> None:
    # Recreate single unique constraint on user_id (one contact per user)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conrelid = 'real_estate_contacts'::regclass
                AND conname IN ('uq_real_estate_contacts_user_id', 'ix_real_estate_contacts_user_id')
            ) THEN
                ALTER TABLE real_estate_contacts
                ADD CONSTRAINT uq_real_estate_contacts_user_id UNIQUE (user_id);
            END IF;
        END $$;
    """)

