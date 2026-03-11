"""PA form: ensure all fields have correct type for display and validation (OACIQ transaction achat)

Revision ID: 055_pa_field_types
Revises: 054_pa_delai_datetime
Create Date: 2026-03-11

Audit and fix field types so dates show correctly (type date), numbers as number,
délai d'acceptation as datetime-local, text/textarea/email/tel as appropriate.
"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


revision: str = "055_pa_field_types"
down_revision: Union[str, None] = "054_pa_delai_datetime"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Field id -> correct type for PA form (matches FormRenderer and user expectations)
PA_FIELD_TYPES = {
    "acheteurs": "textarea",
    "vendeurs": "textarea",
    "acheteur_adresse": "textarea",
    "acheteur_telephone": "tel",
    "acheteur_courriel": "email",
    "vendeur_adresse": "textarea",
    "vendeur_telephone": "tel",
    "vendeur_courriel": "email",
    "property_address": "text",
    "property_city": "text",
    "property_postal_code": "text",
    "property_province": "text",
    "prix_offert": "number",
    "courtier_nom": "text",
    "courtier_permis": "text",
    "description_immeuble": "textarea",
    "prix_achat": "number",
    "acompte": "number",
    "date_acompte": "date",
    "delai_remise_depot": "text",
    "mode_paiement": "textarea",
    "montant_hypotheque": "number",
    "delai_financement": "number",
    "date_acte_vente": "date",
    "date_occupation": "date",
    "nom_notaire": "text",
    "condition_inspection": "number",
    "date_limite_inspection": "date",
    "condition_documents": "number",
    "declarations_vendeur": "textarea",
    "declarations_communes": "textarea",
    "inclusions": "textarea",
    "exclusions": "textarea",
    "autres_conditions": "textarea",
    "annexes": "textarea",
    "delai_acceptation": "datetime-local",
    "date_signature_acheteur": "date",
    "date_signature_vendeur": "date",
}


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
            fid = f.get("id") or f.get("name")
            if fid and fid in PA_FIELD_TYPES:
                f["type"] = PA_FIELD_TYPES[fid]

    conn.execute(
        sa.text("UPDATE forms SET fields = CAST(:fields AS jsonb) WHERE code = 'PA'"),
        {"fields": json.dumps(data)},
    )


def downgrade() -> None:
    # No-op: type changes are backward compatible (form still works with old types)
    pass
