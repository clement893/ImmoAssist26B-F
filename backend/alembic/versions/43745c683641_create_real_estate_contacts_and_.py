"""create_real_estate_contacts_and_transaction_contacts

Revision ID: 43745c683641
Revises: 65c2048cc7c2
Create Date: 2026-01-31 12:34:10.027074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '43745c683641'
down_revision: Union[str, None] = '65c2048cc7c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ContactType enum
    contact_type_enum = postgresql.ENUM(
        'client',
        'real_estate_broker',
        'mortgage_broker',
        'notary',
        'inspector',
        'contractor',
        'insurance_broker',
        'other',
        name='contacttype',
        create_type=True
    )
    contact_type_enum.create(op.get_bind(), checkfirst=True)
    
    # Create real_estate_contacts table
    op.create_table(
        'real_estate_contacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False, comment='Prénom'),
        sa.Column('last_name', sa.String(length=100), nullable=False, comment='Nom de famille'),
        sa.Column('email', sa.String(length=255), nullable=True, comment='Adresse email'),
        sa.Column('phone', sa.String(length=50), nullable=True, comment='Numéro de téléphone'),
        sa.Column('company', sa.String(length=200), nullable=True, comment='Entreprise ou agence'),
        sa.Column('type', contact_type_enum, nullable=False, comment='Type de contact'),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create indexes for real_estate_contacts
    op.create_index('idx_real_estate_contacts_email', 'real_estate_contacts', ['email'], unique=False)
    op.create_index('idx_real_estate_contacts_type', 'real_estate_contacts', ['type'], unique=False)
    op.create_index('idx_real_estate_contacts_user_id', 'real_estate_contacts', ['user_id'], unique=False)
    op.create_index('idx_real_estate_contacts_created_at', 'real_estate_contacts', ['created_at'], unique=False)
    op.create_index(op.f('ix_real_estate_contacts_id'), 'real_estate_contacts', ['id'], unique=False)
    op.create_index(op.f('ix_real_estate_contacts_first_name'), 'real_estate_contacts', ['first_name'], unique=False)
    op.create_index(op.f('ix_real_estate_contacts_last_name'), 'real_estate_contacts', ['last_name'], unique=False)
    
    # Add unique constraint on email
    op.create_unique_constraint('uq_real_estate_contacts_email', 'real_estate_contacts', ['email'])
    # Add unique constraint on user_id
    op.create_unique_constraint('uq_real_estate_contacts_user_id', 'real_estate_contacts', ['user_id'])
    
    # Create transaction_contacts table
    op.create_table(
        'transaction_contacts',
        sa.Column('transaction_id', sa.Integer(), nullable=False, comment='ID de la transaction'),
        sa.Column('contact_id', sa.Integer(), nullable=False, comment='ID du contact'),
        sa.Column('role', sa.String(length=100), nullable=False, comment="Rôle du contact dans cette transaction (ex: 'Vendeur', 'Acheteur', 'Notaire instrumentant')"),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['contact_id'], ['real_estate_contacts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['transaction_id'], ['real_estate_transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('transaction_id', 'contact_id', 'role'),
    )
    
    # Create indexes for transaction_contacts
    op.create_index('idx_transaction_contacts_transaction', 'transaction_contacts', ['transaction_id'], unique=False)
    op.create_index('idx_transaction_contacts_contact', 'transaction_contacts', ['contact_id'], unique=False)
    op.create_index('idx_transaction_contacts_role', 'transaction_contacts', ['role'], unique=False)
    op.create_index('idx_transaction_contacts_composite', 'transaction_contacts', ['transaction_id', 'contact_id', 'role'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_transaction_contacts_composite', table_name='transaction_contacts')
    op.drop_index('idx_transaction_contacts_role', table_name='transaction_contacts')
    op.drop_index('idx_transaction_contacts_contact', table_name='transaction_contacts')
    op.drop_index('idx_transaction_contacts_transaction', table_name='transaction_contacts')
    
    # Drop transaction_contacts table
    op.drop_table('transaction_contacts')
    
    # Drop indexes and constraints for real_estate_contacts
    op.drop_index(op.f('ix_real_estate_contacts_last_name'), table_name='real_estate_contacts')
    op.drop_index(op.f('ix_real_estate_contacts_first_name'), table_name='real_estate_contacts')
    op.drop_index(op.f('ix_real_estate_contacts_id'), table_name='real_estate_contacts')
    op.drop_index('idx_real_estate_contacts_created_at', table_name='real_estate_contacts')
    op.drop_index('idx_real_estate_contacts_user_id', table_name='real_estate_contacts')
    op.drop_index('idx_real_estate_contacts_type', table_name='real_estate_contacts')
    op.drop_index('idx_real_estate_contacts_email', table_name='real_estate_contacts')
    op.drop_constraint('uq_real_estate_contacts_user_id', 'real_estate_contacts', type_='unique')
    op.drop_constraint('uq_real_estate_contacts_email', 'real_estate_contacts', type_='unique')
    
    # Drop real_estate_contacts table
    op.drop_table('real_estate_contacts')
    
    # Drop enum
    contact_type_enum = postgresql.ENUM(name='contacttype')
    contact_type_enum.drop(op.get_bind(), checkfirst=True)
