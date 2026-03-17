"""Update PA form pdf_url to official OACIQ PDF

Revision ID: 051_pa_pdf_url
Revises: 050_rec_user_id_unique_ix
Create Date: 2026-03-09

Référence officielle: https://www.oaciq.com/media/m5seimcc/promesse-achat-immeuble-pag.pdf
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "051_pa_pdf_url"
down_revision: Union[str, None] = "050_rec_user_id_unique_ix"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PA_OFFICIAL_PDF_URL = "https://www.oaciq.com/media/m5seimcc/promesse-achat-immeuble-pag.pdf"


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("UPDATE forms SET pdf_url = :url WHERE code = 'PA'"),
        {"url": PA_OFFICIAL_PDF_URL},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("UPDATE forms SET pdf_url = 'https://www.oaciq.com/formulaires/PA.pdf' WHERE code = 'PA'")
    )
