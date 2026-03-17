"""PA form: set required=True for all fields (identification, coordonnées, bien, prix, acompte, mode paiement, financement, inspection, documents, inclusions/exclusions, délai acceptation)

Revision ID: 053_pa_required
Revises: 052_pa_coordonnees
Create Date: 2026-03-10

Tous les champs listés par l'utilisateur passent en obligatoire.
"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


revision: str = "053_pa_required"
down_revision: Union[str, None] = "052_pa_coordonnees"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# IDs des champs à passer en required=True (tous ceux qui étaient optionnels et doivent être obligatoires)
PA_FIELDS_NOW_REQUIRED = frozenset({
    # Section 1 - Identification des parties (coordonnées)
    "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
    "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
    # Section 2 - Objet de la promesse
    "courtier_nom", "courtier_permis",
    # Section 3 - Description
    "description_immeuble",
    # Section 4 - Prix et acompte
    "date_acompte", "delai_remise_depot",
    # Section 5 - Mode de paiement
    "mode_paiement",
    # Section 6 - Nouvel emprunt hypothécaire
    "montant_hypotheque", "delai_financement",
    # Section 8 - Inspection
    "condition_inspection", "date_limite_inspection",
    # Section 9 - Examen documents
    "condition_documents",
    # Section 12 - Autres déclarations et conditions
    "inclusions", "exclusions", "autres_conditions",
    # Section 14 - Conditions d'acceptation
    "delai_acceptation",
})


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
            if fid and fid in PA_FIELDS_NOW_REQUIRED:
                f["required"] = True

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
            fid = f.get("id") or f.get("name")
            if fid and fid in PA_FIELDS_NOW_REQUIRED:
                f["required"] = False

    conn.execute(
        sa.text("UPDATE forms SET fields = CAST(:fields AS jsonb) WHERE code = 'PA'"),
        {"fields": json.dumps(data)},
    )
