"""Add PA (Promesse d'achat) form fields structure

Revision ID: 049_pa_form_fields
Revises: 048_lea_knowledge
Create Date: 2026-03-05

Populates Form.fields and Form.extraction_schema for the PA (Promesse d'achat) OACIQ form
so that the fill page displays all sections and fields.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "049_pa_form_fields"
down_revision: Union[str, None] = "048_lea_knowledge"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Structure complète des champs du formulaire PA (Promesse d'achat) OACIQ
# Basée sur les 16 sections officielles: https://www.oaciq.com/fr/titulaires-de-permis/guides-pratiques-professionnelles/
PA_FORM_FIELDS = {
    "sections": [
        {
            "id": "section_1",
            "title": "Identification des parties",
            "order": 1,
            "fields": [
                {"id": "acheteurs", "name": "acheteurs", "label": "Nom(s) de l'acheteur (des acheteurs)", "type": "textarea", "required": True},
                {"id": "vendeurs", "name": "vendeurs", "label": "Nom(s) du vendeur (des vendeurs)", "type": "textarea", "required": True},
            ],
        },
        {
            "id": "section_2",
            "title": "Objet de la promesse d'achat",
            "order": 2,
            "fields": [
                {"id": "property_address", "name": "property_address", "label": "Adresse du bien immobilier", "type": "text", "required": True},
                {"id": "property_city", "name": "property_city", "label": "Ville", "type": "text", "required": True},
                {"id": "property_postal_code", "name": "property_postal_code", "label": "Code postal", "type": "text", "required": True},
                {"id": "property_province", "name": "property_province", "label": "Province", "type": "text", "required": True},
                {"id": "prix_offert", "name": "prix_offert", "label": "Prix offert ($)", "type": "number", "required": True, "format": "currency", "currency": "CAD"},
                {"id": "courtier_nom", "name": "courtier_nom", "label": "Nom du courtier immobilier", "type": "text", "required": False},
                {"id": "courtier_permis", "name": "courtier_permis", "label": "Numéro de permis du courtier", "type": "text", "required": False},
            ],
        },
        {
            "id": "section_3",
            "title": "Description sommaire de l'immeuble",
            "order": 3,
            "fields": [
                {"id": "description_immeuble", "name": "description_immeuble", "label": "Description sommaire de l'immeuble", "type": "textarea", "required": False},
            ],
        },
        {
            "id": "section_4",
            "title": "Prix et acompte",
            "order": 4,
            "fields": [
                {"id": "prix_achat", "name": "prix_achat", "label": "Prix d'achat ($)", "type": "number", "required": True, "format": "currency", "currency": "CAD"},
                {"id": "acompte", "name": "acompte", "label": "Montant de l'acompte ($)", "type": "number", "required": True, "format": "currency", "currency": "CAD"},
                {"id": "date_acompte", "name": "date_acompte", "label": "Date de versement de l'acompte", "type": "date", "required": False},
            ],
        },
        {
            "id": "section_5",
            "title": "Mode de paiement",
            "order": 5,
            "fields": [
                {"id": "mode_paiement", "name": "mode_paiement", "label": "Mode de paiement (balance du prix)", "type": "textarea", "required": False},
            ],
        },
        {
            "id": "section_6",
            "title": "Nouvel emprunt hypothécaire",
            "order": 6,
            "fields": [
                {"id": "montant_hypotheque", "name": "montant_hypotheque", "label": "Montant du nouvel emprunt hypothécaire ($)", "type": "number", "required": False, "format": "currency", "currency": "CAD"},
                {"id": "delai_financement", "name": "delai_financement", "label": "Délai pour obtenir le financement (jours)", "type": "number", "required": False},
            ],
        },
        {
            "id": "section_7",
            "title": "Déclarations et obligations de l'acheteur",
            "order": 7,
            "fields": [
                {"id": "date_acte_vente", "name": "date_acte_vente", "label": "Date de signature de l'acte de vente", "type": "date", "required": True},
                {"id": "date_occupation", "name": "date_occupation", "label": "Date de prise de possession", "type": "date", "required": False},
            ],
        },
        {
            "id": "section_8",
            "title": "Inspection par une personne désignée par l'acheteur",
            "order": 8,
            "fields": [
                {"id": "condition_inspection", "name": "condition_inspection", "label": "Condition d'inspection (délai en jours)", "type": "number", "required": False},
                {"id": "date_limite_inspection", "name": "date_limite_inspection", "label": "Date limite pour l'inspection", "type": "date", "required": False},
            ],
        },
        {
            "id": "section_9",
            "title": "Examen de documents par l'acheteur",
            "order": 9,
            "fields": [
                {"id": "condition_documents", "name": "condition_documents", "label": "Condition d'examen des documents (délai en jours)", "type": "number", "required": False},
            ],
        },
        {
            "id": "section_10",
            "title": "Déclarations et obligations du vendeur",
            "order": 10,
            "fields": [
                {"id": "declarations_vendeur", "name": "declarations_vendeur", "label": "Déclarations et obligations du vendeur", "type": "textarea", "required": False},
            ],
        },
        {
            "id": "section_11",
            "title": "Déclarations et obligations communes",
            "order": 11,
            "fields": [
                {"id": "declarations_communes", "name": "declarations_communes", "label": "Déclarations et obligations communes", "type": "textarea", "required": False},
            ],
        },
        {
            "id": "section_12",
            "title": "Autres déclarations et conditions",
            "order": 12,
            "fields": [
                {"id": "inclusions", "name": "inclusions", "label": "Inclusions", "type": "textarea", "required": False},
                {"id": "exclusions", "name": "exclusions", "label": "Exclusions", "type": "textarea", "required": False},
                {"id": "autres_conditions", "name": "autres_conditions", "label": "Autres conditions", "type": "textarea", "required": False},
            ],
        },
        {
            "id": "section_13",
            "title": "Annexes",
            "order": 13,
            "fields": [
                {"id": "annexes", "name": "annexes", "label": "Annexes jointes", "type": "textarea", "required": False},
            ],
        },
        {
            "id": "section_14",
            "title": "Conditions d'acceptation",
            "order": 14,
            "fields": [
                {"id": "delai_acceptation", "name": "delai_acceptation", "label": "Délai d'acceptation (date et heure)", "type": "text", "required": False},
            ],
        },
        {
            "id": "section_15",
            "title": "Interprétation",
            "order": 15,
            "fields": [],
        },
        {
            "id": "section_16",
            "title": "Signatures",
            "order": 16,
            "fields": [
                {"id": "date_signature_acheteur", "name": "date_signature_acheteur", "label": "Date de signature de l'acheteur", "type": "date", "required": False},
                {"id": "date_signature_vendeur", "name": "date_signature_vendeur", "label": "Date de signature du vendeur", "type": "date", "required": False},
            ],
        },
    ]
}

PA_EXTRACTION_SCHEMA = {
    "fields": [
        {"name": "property_address", "description": "Adresse complète du bien immobilier"},
        {"name": "property_city", "description": "Ville"},
        {"name": "property_postal_code", "description": "Code postal"},
        {"name": "property_province", "description": "Province"},
        {"name": "acheteurs", "description": "Noms des acheteurs"},
        {"name": "vendeurs", "description": "Noms des vendeurs"},
        {"name": "prix_offert", "description": "Prix d'achat offert en dollars"},
        {"name": "prix_achat", "description": "Prix d'achat en dollars"},
        {"name": "acompte", "description": "Montant de l'acompte en dollars"},
        {"name": "date_acte_vente", "description": "Date de signature de l'acte de vente"},
        {"name": "date_occupation", "description": "Date de prise de possession"},
        {"name": "expected_closing_date", "description": "Date prévue de clôture"},
    ]
}


def upgrade() -> None:
    import json

    conn = op.get_bind()
    fields_json = json.dumps(PA_FORM_FIELDS)
    extraction_json = json.dumps(PA_EXTRACTION_SCHEMA)

    # Update PA form if it exists (use CAST for proper JSONB handling)
    conn.execute(
        sa.text("""
            UPDATE forms
            SET fields = CAST(:fields AS jsonb), extraction_schema = CAST(:extraction AS jsonb)
            WHERE code = 'PA'
        """),
        {"fields": fields_json, "extraction": extraction_json},
    )

    # If no PA form exists, insert one
    result = conn.execute(sa.text("SELECT id FROM forms WHERE code = 'PA'"))
    if result.fetchone() is None:
        conn.execute(
            sa.text("""
                INSERT INTO forms (code, name, description, category, pdf_url, fields, extraction_schema, submit_button_text, created_at, updated_at)
                VALUES (
                    'PA',
                    'Promesse d''achat – Immeuble principalement résidentiel',
                    'Formulaire OACIQ pour soumettre une offre d''achat sur un immeuble résidentiel.',
                    'obligatoire',
                    'https://www.oaciq.com/formulaires/PA.pdf',
                    CAST(:fields AS jsonb),
                    CAST(:extraction AS jsonb),
                    'Soumettre',
                    NOW(),
                    NOW()
                )
            """),
            {"fields": fields_json, "extraction": extraction_json},
        )


def downgrade() -> None:
    # Revert PA form fields to empty structure (cannot fully restore previous state)
    conn = op.get_bind()
    conn.execute(
        sa.text("""
            UPDATE forms
            SET fields = '{"sections": []}'::jsonb, extraction_schema = NULL
            WHERE code = 'PA'
        """),
    )
