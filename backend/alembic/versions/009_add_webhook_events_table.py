"""Add webhook_events table for idempotency

Revision ID: 009_add_webhook_events
Revises: 008_add_subscriptions
Create Date: 2025-12-21
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009_add_webhook_events'
down_revision = '008_add_subscriptions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create webhook_events table
    if 'webhook_events' not in tables:
        op.create_table(
            'webhook_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('stripe_event_id', sa.String(length=255), nullable=False),
            sa.Column('event_type', sa.String(length=100), nullable=False),
            sa.Column('processed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('event_data', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_webhook_events_stripe_id', 'webhook_events', ['stripe_event_id'], unique=True)
        op.create_index('idx_webhook_events_type', 'webhook_events', ['event_type'], unique=False)
        op.create_index('idx_webhook_events_processed_at', 'webhook_events', ['processed_at'], unique=False)
    else:
        # Table already exists, ensure indexes are present
        indexes = {idx['name'] for idx in inspector.get_indexes('webhook_events')}
        if 'idx_webhook_events_stripe_id' not in indexes:
            op.create_index('idx_webhook_events_stripe_id', 'webhook_events', ['stripe_event_id'], unique=True)
        if 'idx_webhook_events_type' not in indexes:
            op.create_index('idx_webhook_events_type', 'webhook_events', ['event_type'], unique=False)
        if 'idx_webhook_events_processed_at' not in indexes:
            op.create_index('idx_webhook_events_processed_at', 'webhook_events', ['processed_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_webhook_events_processed_at', table_name='webhook_events')
    op.drop_index('idx_webhook_events_type', table_name='webhook_events')
    op.drop_index('idx_webhook_events_stripe_id', table_name='webhook_events')
    op.drop_table('webhook_events')

