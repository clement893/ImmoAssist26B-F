"""add contacts and companies tables

Revision ID: 028
Revises: 027
Create Date: 2025-12-30 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '028'
down_revision = '027_add_hype_modern_theme'
branch_labels = None
depends_on = None


def upgrade():
    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('parent_company_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('website', sa.String(length=500), nullable=True),
        sa.Column('logo_url', sa.String(length=1000), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('is_client', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('facebook', sa.String(length=500), nullable=True),
        sa.Column('instagram', sa.String(length=500), nullable=True),
        sa.Column('linkedin', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_company_id'], ['companies.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for companies
    op.create_index('idx_companies_name', 'companies', ['name'])
    op.create_index('idx_companies_created_at', 'companies', ['created_at'])
    op.create_index('idx_companies_is_client', 'companies', ['is_client'])
    op.create_index('idx_companies_parent_company_id', 'companies', ['parent_company_id'])
    op.create_index('idx_companies_country', 'companies', ['country'])
    
    # Create contacts table
    op.create_table(
        'contacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('position', sa.String(length=200), nullable=True),
        sa.Column('circle', sa.String(length=50), nullable=True),
        sa.Column('linkedin', sa.String(length=500), nullable=True),
        sa.Column('photo_url', sa.String(length=1000), nullable=True),
        sa.Column('photo_filename', sa.String(length=500), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.Column('employee_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for contacts
    op.create_index('idx_contacts_company_id', 'contacts', ['company_id'])
    op.create_index('idx_contacts_employee_id', 'contacts', ['employee_id'])
    op.create_index('idx_contacts_circle', 'contacts', ['circle'])
    op.create_index('idx_contacts_email', 'contacts', ['email'])
    op.create_index('idx_contacts_created_at', 'contacts', ['created_at'])
    op.create_index('idx_contacts_updated_at', 'contacts', ['updated_at'])
    op.create_index(op.f('ix_contacts_first_name'), 'contacts', ['first_name'])
    op.create_index(op.f('ix_contacts_last_name'), 'contacts', ['last_name'])


def downgrade():
    # Drop contacts table and indexes
    op.drop_index(op.f('ix_contacts_last_name'), table_name='contacts')
    op.drop_index(op.f('ix_contacts_first_name'), table_name='contacts')
    op.drop_index('idx_contacts_updated_at', table_name='contacts')
    op.drop_index('idx_contacts_created_at', table_name='contacts')
    op.drop_index('idx_contacts_email', table_name='contacts')
    op.drop_index('idx_contacts_circle', table_name='contacts')
    op.drop_index('idx_contacts_employee_id', table_name='contacts')
    op.drop_index('idx_contacts_company_id', table_name='contacts')
    op.drop_table('contacts')
    
    # Drop companies table and indexes
    op.drop_index('idx_companies_country', table_name='companies')
    op.drop_index('idx_companies_parent_company_id', table_name='companies')
    op.drop_index('idx_companies_is_client', table_name='companies')
    op.drop_index('idx_companies_created_at', table_name='companies')
    op.drop_index('idx_companies_name', table_name='companies')
    op.drop_table('companies')
