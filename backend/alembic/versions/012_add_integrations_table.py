"""Add integrations table

Revision ID: 012_add_integrations_table
Revises: 011_fix_file_model
Create Date: 2025-01-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '012_add_integrations_table'
down_revision = '011_fix_file_model'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create integrations table
    if 'integrations' not in tables:
        op.create_table(
            'integrations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(length=100), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('enabled', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('config', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('credentials', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('last_error', sa.Text(), nullable=True),
            sa.Column('error_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'type', name='uq_integrations_user_type')
        )
        
        # Create indexes
        op.create_index('idx_integrations_user_id', 'integrations', ['user_id'], unique=False)
        op.create_index('idx_integrations_type', 'integrations', ['type'], unique=False)
        op.create_index('idx_integrations_enabled', 'integrations', ['enabled'], unique=False)
        op.create_index('idx_integrations_user_type', 'integrations', ['user_id', 'type'], unique=True)
    else:
        # Table already exists, ensure indexes are present
        indexes = {idx['name'] for idx in inspector.get_indexes('integrations')}
        if 'idx_integrations_user_id' not in indexes:
            op.create_index('idx_integrations_user_id', 'integrations', ['user_id'], unique=False)
        if 'idx_integrations_type' not in indexes:
            op.create_index('idx_integrations_type', 'integrations', ['type'], unique=False)
        if 'idx_integrations_enabled' not in indexes:
            op.create_index('idx_integrations_enabled', 'integrations', ['enabled'], unique=False)
        if 'idx_integrations_user_type' not in indexes:
            op.create_index('idx_integrations_user_type', 'integrations', ['user_id', 'type'], unique=True)


def downgrade() -> None:
    op.drop_index('idx_integrations_user_type', table_name='integrations')
    op.drop_index('idx_integrations_enabled', table_name='integrations')
    op.drop_index('idx_integrations_type', table_name='integrations')
    op.drop_index('idx_integrations_user_id', table_name='integrations')
    op.drop_table('integrations')

