"""add notifications table

Revision ID: 021_add_notifications
Revises: 020_security_audit_logs
Create Date: 2025-01-27 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '021_add_notifications'
down_revision = '023_merge_migration_heads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create notifications table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create notifications table if it doesn't exist
    if 'notifications' not in existing_tables:
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('notification_type', sa.String(length=20), server_default='info', nullable=False),
            sa.Column('read', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('action_url', sa.String(length=500), nullable=True),
            sa.Column('action_label', sa.String(length=100), nullable=True),
            sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        
        # Create indexes
        op.create_index('idx_notifications_user_id', 'notifications', ['user_id'])
        op.create_index('idx_notifications_read', 'notifications', ['read'])
        op.create_index('idx_notifications_created_at', 'notifications', ['created_at'])
        op.create_index('idx_notifications_type', 'notifications', ['notification_type'])
        op.create_index('idx_notifications_user_read', 'notifications', ['user_id', 'read'])
        op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    else:
        # Table exists, check and create indexes if they don't exist
        indexes = [idx['name'] for idx in inspector.get_indexes('notifications')]
        
        if 'idx_notifications_user_id' not in indexes:
            op.create_index('idx_notifications_user_id', 'notifications', ['user_id'])
        if 'idx_notifications_read' not in indexes:
            op.create_index('idx_notifications_read', 'notifications', ['read'])
        if 'idx_notifications_created_at' not in indexes:
            op.create_index('idx_notifications_created_at', 'notifications', ['created_at'])
        if 'idx_notifications_type' not in indexes:
            op.create_index('idx_notifications_type', 'notifications', ['notification_type'])
        if 'idx_notifications_user_read' not in indexes:
            op.create_index('idx_notifications_user_read', 'notifications', ['user_id', 'read'])
        if 'ix_notifications_id' not in indexes:
            op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade database schema - drop notifications table"""
    # Drop indexes first
    op.drop_index('ix_notifications_id', table_name='notifications')
    op.drop_index('idx_notifications_user_read', table_name='notifications')
    op.drop_index('idx_notifications_type', table_name='notifications')
    op.drop_index('idx_notifications_created_at', table_name='notifications')
    op.drop_index('idx_notifications_read', table_name='notifications')
    op.drop_index('idx_notifications_user_id', table_name='notifications')
    
    # Drop table
    op.drop_table('notifications')

