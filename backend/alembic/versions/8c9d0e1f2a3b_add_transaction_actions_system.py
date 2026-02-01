"""add_transaction_actions_system

Revision ID: 8c9d0e1f2a3b
Revises: 7a8b9c0d1e2f
Create Date: 2025-01-XX 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '8c9d0e1f2a3b'
down_revision = '7a8b9c0d1e2f'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    
    # Créer la table transaction_actions seulement si elle n'existe pas
    if 'transaction_actions' not in tables:
        op.create_table(
            'transaction_actions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('code', sa.String(length=50), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('from_status', sa.String(length=50), nullable=False),
            sa.Column('to_status', sa.String(length=50), nullable=False),
            sa.Column('required_documents', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('required_fields', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('required_roles', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('creates_deadline', sa.Boolean(), nullable=True, server_default='false'),
            sa.Column('deadline_days', sa.Integer(), nullable=True),
            sa.Column('deadline_type', sa.String(length=50), nullable=True),
            sa.Column('generates_document', sa.Boolean(), nullable=True, server_default='false'),
            sa.Column('document_template', sa.String(length=100), nullable=True),
            sa.Column('sends_notification', sa.Boolean(), nullable=True, server_default='true'),
            sa.Column('notification_recipients', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('order_index', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('code')
        )
        op.create_index(op.f('ix_transaction_actions_code'), 'transaction_actions', ['code'], unique=True)
        op.create_index(op.f('ix_transaction_actions_id'), 'transaction_actions', ['id'], unique=False)

    # Créer la table action_completions seulement si elle n'existe pas
    if 'action_completions' not in tables:
        op.create_table(
            'action_completions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('action_code', sa.String(length=50), nullable=False),
            sa.Column('completed_by', sa.Integer(), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('previous_status', sa.String(length=50), nullable=False),
            sa.Column('new_status', sa.String(length=50), nullable=False),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['action_code'], ['transaction_actions.code'], ),
            sa.ForeignKeyConstraint(['completed_by'], ['users.id'], ),
            sa.ForeignKeyConstraint(['transaction_id'], ['real_estate_transactions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_action_completions_action_code'), 'action_completions', ['action_code'], unique=False)
        op.create_index(op.f('ix_action_completions_completed_at'), 'action_completions', ['completed_at'], unique=False)
        op.create_index(op.f('ix_action_completions_transaction_id'), 'action_completions', ['transaction_id'], unique=False)

    # Ajouter des colonnes à la table transactions seulement si elles n'existent pas
    columns = [col['name'] for col in inspector.get_columns('real_estate_transactions')]
    
    if 'current_action_code' not in columns:
        op.add_column('real_estate_transactions', sa.Column('current_action_code', sa.String(length=50), nullable=True))
    
    if 'last_action_at' not in columns:
        op.add_column('real_estate_transactions', sa.Column('last_action_at', sa.DateTime(timezone=True), nullable=True))
    
    if 'action_count' not in columns:
        op.add_column('real_estate_transactions', sa.Column('action_count', sa.Integer(), nullable=True, server_default='0'))
    
    # Ajouter la clé étrangère seulement si elle n'existe pas
    fks = inspector.get_foreign_keys('real_estate_transactions')
    fk_exists = any(fk.get('name') == 'fk_transaction_current_action' for fk in fks)
    
    if not fk_exists and 'transaction_actions' in tables:
        op.create_foreign_key(
            'fk_transaction_current_action',
            'real_estate_transactions',
            'transaction_actions',
            ['current_action_code'],
            ['code']
        )


def downgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Drop foreign key first
    fks = inspector.get_foreign_keys('real_estate_transactions')
    fk_exists = any(fk.get('name') == 'fk_transaction_current_action' for fk in fks)
    
    if fk_exists:
        op.drop_constraint('fk_transaction_current_action', 'real_estate_transactions', type_='foreignkey')
    
    # Drop columns if they exist
    columns = [col['name'] for col in inspector.get_columns('real_estate_transactions')]
    
    if 'action_count' in columns:
        op.drop_column('real_estate_transactions', 'action_count')
    
    if 'last_action_at' in columns:
        op.drop_column('real_estate_transactions', 'last_action_at')
    
    if 'current_action_code' in columns:
        op.drop_column('real_estate_transactions', 'current_action_code')
    
    # Drop tables if they exist
    tables = inspector.get_table_names()
    
    if 'action_completions' in tables:
        op.drop_index(op.f('ix_action_completions_transaction_id'), table_name='action_completions')
        op.drop_index(op.f('ix_action_completions_completed_at'), table_name='action_completions')
        op.drop_index(op.f('ix_action_completions_action_code'), table_name='action_completions')
        op.drop_table('action_completions')
    
    if 'transaction_actions' in tables:
        op.drop_index(op.f('ix_transaction_actions_id'), table_name='transaction_actions')
        op.drop_index(op.f('ix_transaction_actions_code'), table_name='transaction_actions')
        op.drop_table('transaction_actions')
