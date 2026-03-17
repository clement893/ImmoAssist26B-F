"""Add portail client models (ImmoAssist)

Revision ID: 037_portail_client
Revises: 036_fix_txn_actions
Create Date: 2026-02-01 12:00:00.000000

Creates client_invitations, portail_transactions, transaction_documents,
transaction_messages, transaction_taches, transaction_etapes and adds
client_invitation_id to users.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = '037_portail_client'
down_revision: Union[str, None] = '036_fix_txn_actions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    conn = op.get_bind()
    inspector = inspect(conn)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not table_exists('client_invitations'):
        op.create_table(
            'client_invitations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('courtier_id', sa.Integer(), nullable=False),
            sa.Column('prenom', sa.String(length=100), nullable=False),
            sa.Column('nom', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('telephone', sa.String(length=50), nullable=True),
            sa.Column('type_projet', sa.String(length=50), nullable=False),
            sa.Column('statut', sa.String(length=50), nullable=False, server_default='invite'),
            sa.Column('token', sa.String(length=64), nullable=False),
            sa.Column('date_invitation', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('date_activation', sa.DateTime(timezone=True), nullable=True),
            sa.Column('derniere_connexion', sa.DateTime(timezone=True), nullable=True),
            sa.Column('message_personnalise', sa.Text(), nullable=True),
            sa.Column('acces_documents', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('acces_messagerie', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('acces_taches', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('acces_calendrier', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('acces_proprietes', sa.Boolean(), nullable=False, server_default='true'),
            sa.ForeignKeyConstraint(['courtier_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_client_invitations_courtier_id', 'client_invitations', ['courtier_id'])
        op.create_index('idx_client_invitations_email', 'client_invitations', ['email'], unique=True)
        op.create_index('idx_client_invitations_statut', 'client_invitations', ['statut'])
        op.create_index('idx_client_invitations_token', 'client_invitations', ['token'], unique=True)

    if not column_exists('users', 'client_invitation_id'):
        op.add_column('users', sa.Column('client_invitation_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_users_client_invitation_id', 'users', 'client_invitations', ['client_invitation_id'], ['id'])
        op.create_index('ix_users_client_invitation_id', 'users', ['client_invitation_id'], unique=True)

    if not table_exists('portail_transactions'):
        op.create_table(
            'portail_transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('client_invitation_id', sa.Integer(), nullable=False),
            sa.Column('courtier_id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('statut', sa.String(length=50), nullable=False, server_default='recherche'),
            sa.Column('progression', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('date_debut', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('date_fin', sa.DateTime(timezone=True), nullable=True),
            sa.Column('adresse', sa.String(length=255), nullable=True),
            sa.Column('ville', sa.String(length=100), nullable=True),
            sa.Column('prix_offert', sa.Numeric(precision=12, scale=2), nullable=True),
            sa.Column('prix_accepte', sa.Numeric(precision=12, scale=2), nullable=True),
            sa.ForeignKeyConstraint(['client_invitation_id'], ['client_invitations.id'], ),
            sa.ForeignKeyConstraint(['courtier_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_portail_transactions_client_invitation_id', 'portail_transactions', ['client_invitation_id'])
        op.create_index('idx_portail_transactions_courtier_id', 'portail_transactions', ['courtier_id'])
        op.create_index('idx_portail_transactions_statut', 'portail_transactions', ['statut'])

    if not table_exists('transaction_documents'):
        op.create_table(
            'transaction_documents',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('nom', sa.String(length=255), nullable=False),
            sa.Column('type', sa.String(length=50), nullable=False),
            sa.Column('categorie', sa.String(length=100), nullable=False),
            sa.Column('taille', sa.String(length=50), nullable=True),
            sa.Column('url', sa.String(length=500), nullable=False),
            sa.Column('partage_par_id', sa.Integer(), nullable=False),
            sa.Column('date_partage', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('nouveau', sa.Boolean(), nullable=False, server_default='true'),
            sa.ForeignKeyConstraint(['transaction_id'], ['portail_transactions.id'], ),
            sa.ForeignKeyConstraint(['partage_par_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_transaction_documents_transaction_id', 'transaction_documents', ['transaction_id'])
        op.create_index('idx_transaction_documents_partage_par_id', 'transaction_documents', ['partage_par_id'])

    if not table_exists('transaction_messages'):
        op.create_table(
            'transaction_messages',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('expediteur_id', sa.Integer(), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('date_envoi', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('lu', sa.Boolean(), nullable=False, server_default='false'),
            sa.ForeignKeyConstraint(['transaction_id'], ['portail_transactions.id'], ),
            sa.ForeignKeyConstraint(['expediteur_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_transaction_messages_transaction_id', 'transaction_messages', ['transaction_id'])
        op.create_index('idx_transaction_messages_expediteur_id', 'transaction_messages', ['expediteur_id'])

    if not table_exists('transaction_taches'):
        op.create_table(
            'transaction_taches',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('titre', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('priorite', sa.String(length=50), nullable=False),
            sa.Column('categorie', sa.String(length=100), nullable=False),
            sa.Column('echeance', sa.DateTime(timezone=True), nullable=False),
            sa.Column('completee', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('date_completion', sa.DateTime(timezone=True), nullable=True),
            sa.Column('cree_par_id', sa.Integer(), nullable=False),
            sa.Column('date_creation', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['transaction_id'], ['portail_transactions.id'], ),
            sa.ForeignKeyConstraint(['cree_par_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_transaction_taches_transaction_id', 'transaction_taches', ['transaction_id'])
        op.create_index('idx_transaction_taches_cree_par_id', 'transaction_taches', ['cree_par_id'])
        op.create_index('idx_transaction_taches_completee', 'transaction_taches', ['completee'])

    if not table_exists('transaction_etapes'):
        op.create_table(
            'transaction_etapes',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('titre', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('ordre', sa.Integer(), nullable=False),
            sa.Column('statut', sa.String(length=50), nullable=False, server_default='a_planifier'),
            sa.Column('date_planifiee', sa.DateTime(timezone=True), nullable=True),
            sa.Column('heure_planifiee', sa.String(length=20), nullable=True),
            sa.Column('date_completion', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['transaction_id'], ['portail_transactions.id'], ),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('idx_transaction_etapes_transaction_id', 'transaction_etapes', ['transaction_id'])
        op.create_index('idx_transaction_etapes_ordre', 'transaction_etapes', ['ordre'])


def downgrade() -> None:
    if table_exists('transaction_etapes'):
        op.drop_index('idx_transaction_etapes_ordre', table_name='transaction_etapes')
        op.drop_index('idx_transaction_etapes_transaction_id', table_name='transaction_etapes')
        op.drop_table('transaction_etapes')
    if table_exists('transaction_taches'):
        op.drop_index('idx_transaction_taches_completee', table_name='transaction_taches')
        op.drop_index('idx_transaction_taches_cree_par_id', table_name='transaction_taches')
        op.drop_index('idx_transaction_taches_transaction_id', table_name='transaction_taches')
        op.drop_table('transaction_taches')
    if table_exists('transaction_messages'):
        op.drop_index('idx_transaction_messages_expediteur_id', table_name='transaction_messages')
        op.drop_index('idx_transaction_messages_transaction_id', table_name='transaction_messages')
        op.drop_table('transaction_messages')
    if table_exists('transaction_documents'):
        op.drop_index('idx_transaction_documents_partage_par_id', table_name='transaction_documents')
        op.drop_index('idx_transaction_documents_transaction_id', table_name='transaction_documents')
        op.drop_table('transaction_documents')
    if table_exists('portail_transactions'):
        op.drop_index('idx_portail_transactions_statut', table_name='portail_transactions')
        op.drop_index('idx_portail_transactions_courtier_id', table_name='portail_transactions')
        op.drop_index('idx_portail_transactions_client_invitation_id', table_name='portail_transactions')
        op.drop_table('portail_transactions')
    if column_exists('users', 'client_invitation_id'):
        op.drop_constraint('fk_users_client_invitation_id', 'users', type_='foreignkey')
        op.drop_index('ix_users_client_invitation_id', table_name='users')
        op.drop_column('users', 'client_invitation_id')
    if table_exists('client_invitations'):
        op.drop_index('idx_client_invitations_token', table_name='client_invitations')
        op.drop_index('idx_client_invitations_statut', table_name='client_invitations')
        op.drop_index('idx_client_invitations_email', table_name='client_invitations')
        op.drop_index('idx_client_invitations_courtier_id', table_name='client_invitations')
        op.drop_table('client_invitations')
