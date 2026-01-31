"""Add user_preferences table

Revision ID: 019_add_user_preferences
Revises: 018_create_theme_fonts
Create Date: 2025-01-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '019_add_user_preferences'
down_revision = '018_create_theme_fonts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create user_preferences table
    if 'user_preferences' not in tables:
        op.create_table(
            'user_preferences',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('key', sa.String(length=100), nullable=False),
            sa.Column('value', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'key', name='uq_user_preferences_user_key')
        )
        
        # Create indexes
        op.create_index('idx_user_preferences_user', 'user_preferences', ['user_id'], unique=False)
        op.create_index('idx_user_preferences_key', 'user_preferences', ['key'], unique=False)
    else:
        # Table already exists, ensure indexes are present
        indexes = {idx['name'] for idx in inspector.get_indexes('user_preferences')}
        if 'idx_user_preferences_user' not in indexes:
            op.create_index('idx_user_preferences_user', 'user_preferences', ['user_id'], unique=False)
        if 'idx_user_preferences_key' not in indexes:
            op.create_index('idx_user_preferences_key', 'user_preferences', ['key'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_user_preferences_key', table_name='user_preferences')
    op.drop_index('idx_user_preferences_user', table_name='user_preferences')
    op.drop_table('user_preferences')

