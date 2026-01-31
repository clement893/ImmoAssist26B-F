"""create_real_estate_transactions_table

Revision ID: 4ef61c3e1e3b
Revises: 033_create_lea_conversations
Create Date: 2026-01-31 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4ef61c3e1e3b'
down_revision: Union[str, None] = '033_create_lea_conversations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'real_estate_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        
        # 1. Identification de la transaction
        sa.Column('dossier_number', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='En cours'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expected_closing_date', sa.Date(), nullable=True),
        sa.Column('actual_closing_date', sa.Date(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        # 2. Informations sur la propriété
        sa.Column('property_address', sa.String(), nullable=False),
        sa.Column('property_city', sa.String(), nullable=False),
        sa.Column('property_postal_code', sa.String(), nullable=False),
        sa.Column('property_province', sa.String(), nullable=False, server_default='QC'),
        sa.Column('lot_number', sa.String(), nullable=True),
        sa.Column('matricule_number', sa.String(), nullable=True),
        sa.Column('property_type', sa.String(), nullable=True),
        sa.Column('construction_year', sa.Integer(), nullable=True),
        sa.Column('land_area_sqft', sa.Numeric(10, 2), nullable=True),
        sa.Column('land_area_sqm', sa.Numeric(10, 2), nullable=True),
        sa.Column('living_area_sqft', sa.Numeric(10, 2), nullable=True),
        sa.Column('living_area_sqm', sa.Numeric(10, 2), nullable=True),
        sa.Column('total_rooms', sa.Integer(), nullable=True),
        sa.Column('bedrooms', sa.Integer(), nullable=True),
        sa.Column('bathrooms', sa.Integer(), nullable=True),
        sa.Column('inclusions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('exclusions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        
        # 3. Parties impliquées
        sa.Column('sellers', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('buyers', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        
        # Professionnels
        sa.Column('seller_broker_name', sa.String(), nullable=True),
        sa.Column('seller_broker_agency', sa.String(), nullable=True),
        sa.Column('seller_broker_oaciq', sa.String(), nullable=True),
        sa.Column('seller_broker_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('buyer_broker_name', sa.String(), nullable=True),
        sa.Column('buyer_broker_agency', sa.String(), nullable=True),
        sa.Column('buyer_broker_oaciq', sa.String(), nullable=True),
        sa.Column('buyer_broker_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notary_name', sa.String(), nullable=True),
        sa.Column('notary_firm', sa.String(), nullable=True),
        sa.Column('notary_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('inspector_name', sa.String(), nullable=True),
        sa.Column('inspector_company', sa.String(), nullable=True),
        sa.Column('inspector_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('surveyor_name', sa.String(), nullable=True),
        sa.Column('surveyor_company', sa.String(), nullable=True),
        sa.Column('surveyor_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('mortgage_advisor_name', sa.String(), nullable=True),
        sa.Column('mortgage_advisor_institution', sa.String(), nullable=True),
        sa.Column('mortgage_advisor_contact', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        
        # 4. Détails de la transaction financière
        sa.Column('listing_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('offered_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('final_sale_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('deposit_amount', sa.Numeric(12, 2), nullable=True),
        sa.Column('broker_commission_percent', sa.Numeric(5, 2), nullable=True),
        sa.Column('broker_commission_amount', sa.Numeric(12, 2), nullable=True),
        sa.Column('commission_split', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        
        # 5. Financement hypothécaire
        sa.Column('down_payment_amount', sa.Numeric(12, 2), nullable=True),
        sa.Column('mortgage_amount', sa.Numeric(12, 2), nullable=True),
        sa.Column('mortgage_institution', sa.String(), nullable=True),
        sa.Column('mortgage_type', sa.String(), nullable=True),
        sa.Column('mortgage_interest_rate', sa.Numeric(5, 2), nullable=True),
        sa.Column('mortgage_term_years', sa.Integer(), nullable=True),
        sa.Column('amortization_years', sa.Integer(), nullable=True),
        sa.Column('mortgage_insurance_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('mortgage_insurance_amount', sa.Numeric(12, 2), nullable=True),
        
        # 6. Processus et étapes clés
        sa.Column('promise_to_purchase_date', sa.Date(), nullable=True),
        sa.Column('promise_acceptance_date', sa.Date(), nullable=True),
        sa.Column('inspection_deadline', sa.Date(), nullable=True),
        sa.Column('inspection_date', sa.Date(), nullable=True),
        sa.Column('inspection_condition_lifted_date', sa.Date(), nullable=True),
        sa.Column('financing_deadline', sa.Date(), nullable=True),
        sa.Column('financing_condition_lifted_date', sa.Date(), nullable=True),
        sa.Column('mortgage_act_signing_date', sa.Date(), nullable=True),
        sa.Column('sale_act_signing_date', sa.Date(), nullable=True),
        sa.Column('possession_date', sa.Date(), nullable=True),
        
        # 7. Documents et vérifications
        sa.Column('location_certificate_received', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('location_certificate_date', sa.Date(), nullable=True),
        sa.Column('location_certificate_conform', sa.Boolean(), nullable=True),
        sa.Column('seller_declaration_signed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('seller_declaration_date', sa.Date(), nullable=True),
        sa.Column('inspection_report_received', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('inspection_report_satisfactory', sa.Boolean(), nullable=True),
        sa.Column('financing_approval_received', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('financing_approval_date', sa.Date(), nullable=True),
        sa.Column('home_insurance_proof_received', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('seller_quittance_received', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('seller_quittance_amount', sa.Numeric(12, 2), nullable=True),
        
        # 8. Frais et coûts - Acheteur
        sa.Column('buyer_mutation_tax', sa.Numeric(12, 2), nullable=True),
        sa.Column('buyer_notary_fees_sale', sa.Numeric(12, 2), nullable=True),
        sa.Column('buyer_notary_fees_mortgage', sa.Numeric(12, 2), nullable=True),
        sa.Column('buyer_inspection_fees', sa.Numeric(12, 2), nullable=True),
        sa.Column('buyer_appraisal_fees', sa.Numeric(12, 2), nullable=True),
        sa.Column('buyer_insurance_tax', sa.Numeric(12, 2), nullable=True),
        
        # 8. Frais et coûts - Vendeur
        sa.Column('seller_broker_commission_total', sa.Numeric(12, 2), nullable=True),
        sa.Column('seller_quittance_fees', sa.Numeric(12, 2), nullable=True),
        sa.Column('seller_mortgage_penalty', sa.Numeric(12, 2), nullable=True),
        sa.Column('seller_location_certificate_fees', sa.Numeric(12, 2), nullable=True),
        
        # 9. Ajustements notariés
        sa.Column('adjustment_municipal_taxes', sa.Numeric(12, 2), nullable=True),
        sa.Column('adjustment_school_taxes', sa.Numeric(12, 2), nullable=True),
        sa.Column('adjustment_condo_fees', sa.Numeric(12, 2), nullable=True),
        sa.Column('adjustment_rental_income', sa.Numeric(12, 2), nullable=True),
        
        # 10. Informations post-transaction
        sa.Column('registry_publication_number', sa.String(), nullable=True),
        sa.Column('seller_quittance_confirmed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        
        # Relations
        sa.Column('user_id', sa.Integer(), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_real_estate_transactions_dossier_number'), 'real_estate_transactions', ['dossier_number'], unique=True)
    op.create_index(op.f('ix_real_estate_transactions_id'), 'real_estate_transactions', ['id'], unique=False)
    op.create_foreign_key(
        'fk_real_estate_transactions_user_id',
        'real_estate_transactions',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_real_estate_transactions_id'), table_name='real_estate_transactions')
    op.drop_index(op.f('ix_real_estate_transactions_dossier_number'), table_name='real_estate_transactions')
    op.drop_table('real_estate_transactions')
