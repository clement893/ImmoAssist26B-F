"""add_oaciq_fields_to_forms

Revision ID: 66a1b2c3d4e5
Revises: 65c2048cc7c2
Create Date: 2026-01-31 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '66a1b2c3d4e5'
down_revision: Union[str, None] = '65c2048cc7c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add OACIQ-specific fields to forms and form_submissions tables"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col['name'] for col in inspector.get_columns('forms')}
    
    # Add OACIQ fields to forms table
    if 'code' not in existing_columns:
        op.add_column('forms', sa.Column('code', sa.String(20), nullable=True))
        # Create unique index only for non-null values to avoid conflicts
        op.execute("""
            CREATE UNIQUE INDEX idx_forms_code 
            ON forms (code) 
            WHERE code IS NOT NULL
        """)
    
    if 'category' not in existing_columns:
        op.add_column('forms', sa.Column('category', sa.String(50), nullable=True))
        op.create_index('idx_forms_category', 'forms', ['category'])
    
    if 'pdf_url' not in existing_columns:
        op.add_column('forms', sa.Column('pdf_url', sa.Text(), nullable=True))
    
    if 'transaction_id' not in existing_columns:
        op.add_column('forms', sa.Column('transaction_id', sa.Integer(), nullable=True))
        op.create_index('idx_forms_transaction_id', 'forms', ['transaction_id'])
        op.create_foreign_key(
            'fk_forms_transaction_id',
            'forms', 'real_estate_transactions',
            ['transaction_id'], ['id'],
            ondelete='SET NULL'
        )
    
    # Add status and transaction_id to form_submissions
    existing_submission_columns = {col['name'] for col in inspector.get_columns('form_submissions')}
    
    if 'status' not in existing_submission_columns:
        op.add_column('form_submissions', sa.Column('status', sa.String(20), nullable=True, server_default='draft'))
        op.create_index('idx_form_submissions_status', 'form_submissions', ['status'])
    
    if 'transaction_id' not in existing_submission_columns:
        op.add_column('form_submissions', sa.Column('transaction_id', sa.Integer(), nullable=True))
        op.create_index('idx_form_submissions_transaction_id', 'form_submissions', ['transaction_id'])
        op.create_foreign_key(
            'fk_form_submissions_transaction_id',
            'form_submissions', 'real_estate_transactions',
            ['transaction_id'], ['id'],
            ondelete='SET NULL'
        )
    
    # Create form_submission_versions table
    existing_tables = inspector.get_table_names()
    if 'form_submission_versions' not in existing_tables:
        op.create_table(
            'form_submission_versions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=False),
            sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['submission_id'], ['form_submissions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_form_submission_versions_submission_id', 'form_submission_versions', ['submission_id'])
        op.create_index('idx_form_submission_versions_created_at', 'form_submission_versions', ['created_at'])


def downgrade() -> None:
    """Remove OACIQ-specific fields"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Drop form_submission_versions table
    if 'form_submission_versions' in existing_tables:
        op.drop_index('idx_form_submission_versions_created_at', table_name='form_submission_versions')
        op.drop_index('idx_form_submission_versions_submission_id', table_name='form_submission_versions')
        op.drop_table('form_submission_versions')
    
    # Remove columns from form_submissions
    existing_submission_columns = {col['name'] for col in inspector.get_columns('form_submissions')}
    
    if 'transaction_id' in existing_submission_columns:
        op.drop_constraint('fk_form_submissions_transaction_id', 'form_submissions', type_='foreignkey')
        op.drop_index('idx_form_submissions_transaction_id', table_name='form_submissions')
        op.drop_column('form_submissions', 'transaction_id')
    
    if 'status' in existing_submission_columns:
        op.drop_index('idx_form_submissions_status', table_name='form_submissions')
        op.drop_column('form_submissions', 'status')
    
    # Remove columns from forms
    existing_columns = {col['name'] for col in inspector.get_columns('forms')}
    
    if 'transaction_id' in existing_columns:
        op.drop_constraint('fk_forms_transaction_id', 'forms', type_='foreignkey')
        op.drop_index('idx_forms_transaction_id', table_name='forms')
        op.drop_column('forms', 'transaction_id')
    
    if 'pdf_url' in existing_columns:
        op.drop_column('forms', 'pdf_url')
    
    if 'category' in existing_columns:
        op.drop_index('idx_forms_category', table_name='forms')
        op.drop_column('forms', 'category')
    
    if 'code' in existing_columns:
        op.drop_index('idx_forms_code', table_name='forms')
        op.drop_column('forms', 'code')
