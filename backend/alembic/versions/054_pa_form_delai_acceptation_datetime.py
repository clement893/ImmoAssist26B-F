"""PA form: delai_acceptation as datetime-local (date + time), required

Revision ID: 054_pa_delai_datetime
Revises: 053_pa_required
Create Date: 2026-03-11

Change PA form field delai_acceptation from type "text" to "datetime-local"
so the form shows a date+time picker and the value is stored in a standard format.
"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


revision: str = "054_pa_delai_datetime"
down_revision: Union[str, None] = "053_pa_required"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    r = conn.execute(sa.text("SELECT id, fields FROM forms WHERE code = 'PA'"))
    row = r.fetchone()
    if not row or not row[1]:
        return
    try:
        data = json.loads(row[1]) if isinstance(row[1], str) else row[1]
    except Exception:
        return
    sections = data.get("sections")
    if not isinstance(sections, list):
        return

    for section in sections:
        fields = section.get("fields")
        if not isinstance(fields, list):
            continue
        for f in fields:
            if (f.get("id") or f.get("name")) == "delai_acceptation":
                f["type"] = "datetime-local"
                f["required"] = True
                break

    conn.execute(
        sa.text("UPDATE forms SET fields = CAST(:fields AS jsonb) WHERE code = 'PA'"),
        {"fields": json.dumps(data)},
    )


def downgrade() -> None:
    conn = op.get_bind()
    r = conn.execute(sa.text("SELECT id, fields FROM forms WHERE code = 'PA'"))
    row = r.fetchone()
    if not row or not row[1]:
        return
    try:
        data = json.loads(row[1]) if isinstance(row[1], str) else row[1]
    except Exception:
        return
    sections = data.get("sections")
    if not isinstance(sections, list):
        return

    for section in sections:
        fields = section.get("fields")
        if not isinstance(fields, list):
            continue
        for f in fields:
            if (f.get("id") or f.get("name")) == "delai_acceptation":
                f["type"] = "text"
                f["required"] = True
                break

    conn.execute(
        sa.text("UPDATE forms SET fields = CAST(:fields AS jsonb) WHERE code = 'PA'"),
        {"fields": json.dumps(data)},
    )
