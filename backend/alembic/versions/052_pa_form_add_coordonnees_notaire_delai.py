"""Add PA form fields: coordonnées parties, nom notaire, délai remise dépôt (fiche technique)

Revision ID: 052_pa_coordonnees
Revises: 051_pa_pdf_url
Create Date: 2026-03-10

Fiche technique: tous les champs doivent être présents pour que l'assistant guide
le remplissage complet (coordonnées acheteur/vendeur, nom notaire, délai remise dépôt).
"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


revision: str = "052_pa_coordonnees"
down_revision: Union[str, None] = "051_pa_pdf_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Nouveaux champs à ajouter au formulaire PA (en plus de 049)
# Section 1 - Identification des parties : coordonnées (fiche technique §2)
PA_SECTION_1_EXTRA_FIELDS = [
    {"id": "acheteur_adresse", "name": "acheteur_adresse", "label": "Adresse de l'acheteur", "type": "textarea", "required": False},
    {"id": "acheteur_telephone", "name": "acheteur_telephone", "label": "Téléphone de l'acheteur", "type": "tel", "required": False},
    {"id": "acheteur_courriel", "name": "acheteur_courriel", "label": "Courriel de l'acheteur", "type": "email", "required": False},
    {"id": "vendeur_adresse", "name": "vendeur_adresse", "label": "Adresse du vendeur", "type": "textarea", "required": False},
    {"id": "vendeur_telephone", "name": "vendeur_telephone", "label": "Téléphone du vendeur", "type": "tel", "required": False},
    {"id": "vendeur_courriel", "name": "vendeur_courriel", "label": "Courriel du vendeur", "type": "email", "required": False},
]
# Section 4 - Dépôt : délai pour remettre le dépôt
PA_SECTION_4_EXTRA_FIELDS = [
    {"id": "delai_remise_depot", "name": "delai_remise_depot", "label": "Délai pour remettre le dépôt (jours ou précision)", "type": "text", "required": False},
]
# Section 7 - Signature acte : nom du notaire (optionnel)
PA_SECTION_7_EXTRA_FIELDS = [
    {"id": "nom_notaire", "name": "nom_notaire", "label": "Nom du notaire (optionnel)", "type": "text", "required": False},
]


def upgrade() -> None:
    conn = op.get_bind()
    # Lire le champ fields actuel du formulaire PA
    r = conn.execute(sa.text("SELECT id, fields FROM forms WHERE code = 'PA'"))
    row = r.fetchone()
    if not row:
        return
    form_id, fields_json = row[0], row[1]
    if not fields_json:
        return
    try:
        data = json.loads(fields_json) if isinstance(fields_json, str) else fields_json
    except Exception:
        return
    sections = data.get("sections")
    if not isinstance(sections, list):
        return

    # Section 1 : Identification des parties
    for s in sections:
        if s.get("id") == "section_1":
            s.setdefault("fields", [])
            for f in PA_SECTION_1_EXTRA_FIELDS:
                if not any((x.get("id") or x.get("name")) == f["id"] for x in s["fields"]):
                    s["fields"].append(f)
            break
    # Section 4 : Prix et acompte
    for s in sections:
        if s.get("id") == "section_4":
            s.setdefault("fields", [])
            for f in PA_SECTION_4_EXTRA_FIELDS:
                if not any((x.get("id") or x.get("name")) == f["id"] for x in s["fields"]):
                    s["fields"].append(f)
            break
    # Section 7 : Date acte de vente + nom notaire
    for s in sections:
        if s.get("id") == "section_7":
            s.setdefault("fields", [])
            for f in PA_SECTION_7_EXTRA_FIELDS:
                if not any((x.get("id") or x.get("name")) == f["id"] for x in s["fields"]):
                    s["fields"].append(f)
            break

    new_json = json.dumps(data)
    conn.execute(
        sa.text("UPDATE forms SET fields = CAST(:fields AS jsonb) WHERE code = 'PA'"),
        {"fields": new_json},
    )


def downgrade() -> None:
    # Retirer les champs ajoutés (revenir à la structure 049/051)
    conn = op.get_bind()
    r = conn.execute(sa.text("SELECT fields FROM forms WHERE code = 'PA'"))
    row = r.fetchone()
    if not row or not row[0]:
        return
    try:
        data = json.loads(row[0]) if isinstance(row[0], str) else row[0]
    except Exception:
        return
    sections = data.get("sections")
    if not isinstance(sections, list):
        return
    extra_ids = {
        "acheteur_adresse", "acheteur_telephone", "acheteur_courriel",
        "vendeur_adresse", "vendeur_telephone", "vendeur_courriel",
        "delai_remise_depot", "nom_notaire",
    }
    for s in sections:
        if isinstance(s.get("fields"), list):
            s["fields"] = [f for f in s["fields"] if (f.get("id") or f.get("name")) not in extra_ids]
    conn.execute(
        sa.text("UPDATE forms SET fields = CAST(:fields AS jsonb) WHERE code = 'PA'"),
        {"fields": json.dumps(data)},
    )
