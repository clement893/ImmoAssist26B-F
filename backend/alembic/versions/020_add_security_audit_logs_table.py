"""add security audit logs table

Revision ID: 020_security_audit_logs
Revises: 019_add_user_preferences
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '020_security_audit_logs'
down_revision = '019_add_user_preferences'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create security_audit_logs table if it doesn't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create security_audit_logs table if it doesn't exist
    if 'security_audit_logs' not in existing_tables:
        op.create_table(
            'security_audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('event_type', sa.String(length=50), nullable=False),
            sa.Column('severity', sa.String(length=20), server_default='info', nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('user_email', sa.String(length=255), nullable=True),
            sa.Column('api_key_id', sa.Integer(), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.String(length=500), nullable=True),
            sa.Column('request_method', sa.String(length=10), nullable=True),
            sa.Column('request_path', sa.String(length=500), nullable=True),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('success', sa.String(length=10), server_default='unknown', nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        
        # Create indexes
        op.create_index('idx_security_audit_user_id', 'security_audit_logs', ['user_id'])
        op.create_index('idx_security_audit_event_type', 'security_audit_logs', ['event_type'])
        op.create_index('idx_security_audit_timestamp', 'security_audit_logs', ['timestamp'])
        op.create_index('idx_security_audit_ip_address', 'security_audit_logs', ['ip_address'])
        op.create_index(op.f('ix_security_audit_logs_id'), 'security_audit_logs', ['id'], unique=False)
    else:
        # Table exists, check and create indexes if they don't exist
        indexes = [idx['name'] for idx in inspector.get_indexes('security_audit_logs')]
        
        if 'idx_security_audit_user_id' not in indexes:
            op.create_index('idx_security_audit_user_id', 'security_audit_logs', ['user_id'])
        if 'idx_security_audit_event_type' not in indexes:
            op.create_index('idx_security_audit_event_type', 'security_audit_logs', ['event_type'])
        if 'idx_security_audit_timestamp' not in indexes:
            op.create_index('idx_security_audit_timestamp', 'security_audit_logs', ['timestamp'])
        if 'idx_security_audit_ip_address' not in indexes:
            op.create_index('idx_security_audit_ip_address', 'security_audit_logs', ['ip_address'])
        if 'ix_security_audit_logs_id' not in indexes:
            op.create_index(op.f('ix_security_audit_logs_id'), 'security_audit_logs', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade database schema - drop security_audit_logs table"""
    # Drop indexes first
    op.drop_index('ix_security_audit_logs_id', table_name='security_audit_logs')
    op.drop_index('idx_security_audit_ip_address', table_name='security_audit_logs')
    op.drop_index('idx_security_audit_timestamp', table_name='security_audit_logs')
    op.drop_index('idx_security_audit_event_type', table_name='security_audit_logs')
    op.drop_index('idx_security_audit_user_id', table_name='security_audit_logs')
    
    # Drop table
    op.drop_table('security_audit_logs')

