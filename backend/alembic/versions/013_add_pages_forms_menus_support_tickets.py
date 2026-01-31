"""add pages forms menus support tickets

Revision ID: 013_pages_forms_menus_tickets
Revises: 012_add_integrations_table
Create Date: 2025-01-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '013_pages_forms_menus_tickets'
down_revision = '012_add_integrations_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade database schema - create tables if they don't exist"""
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    # Create pages table if it doesn't exist
    if 'pages' not in existing_tables:
        op.create_table(
            'pages',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('title', sa.String(length=200), nullable=False),
            sa.Column('slug', sa.String(length=200), nullable=False),
            sa.Column('content', sa.Text(), nullable=True),
            sa.Column('content_html', sa.Text(), nullable=True),
            sa.Column('sections', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
            sa.Column('meta_title', sa.String(length=200), nullable=True),
            sa.Column('meta_description', sa.Text(), nullable=True),
            sa.Column('meta_keywords', sa.String(length=500), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_pages_slug', 'pages', ['slug'], unique=True)
        op.create_index('idx_pages_status', 'pages', ['status'])
        op.create_index('idx_pages_user_id', 'pages', ['user_id'])
        op.create_index('idx_pages_created_at', 'pages', ['created_at'])

    # Create forms table if it doesn't exist
    if 'forms' not in existing_tables:
        op.create_table(
            'forms',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('fields', postgresql.JSON(astext_type=sa.Text()), nullable=False),
            sa.Column('submit_button_text', sa.String(length=50), nullable=False, server_default='Submit'),
            sa.Column('success_message', sa.Text(), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_forms_name', 'forms', ['name'])
        op.create_index('idx_forms_user_id', 'forms', ['user_id'])
        op.create_index('idx_forms_created_at', 'forms', ['created_at'])

    # Create form_submissions table if it doesn't exist
    if 'form_submissions' not in existing_tables:
        op.create_table(
            'form_submissions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('form_id', sa.Integer(), nullable=False),
            sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.String(length=500), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['form_id'], ['forms.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_form_submissions_form_id', 'form_submissions', ['form_id'])
        op.create_index('idx_form_submissions_submitted_at', 'form_submissions', ['submitted_at'])

    # Create menus table if it doesn't exist
    if 'menus' not in existing_tables:
        op.create_table(
            'menus',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=200), nullable=False),
            sa.Column('location', sa.String(length=50), nullable=False),
            sa.Column('items', postgresql.JSON(astext_type=sa.Text()), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_menus_name', 'menus', ['name'])
        op.create_index('idx_menus_location', 'menus', ['location'])
        op.create_index('idx_menus_user_id', 'menus', ['user_id'])

    # Create support_tickets table if it doesn't exist
    if 'support_tickets' not in existing_tables:
        op.create_table(
            'support_tickets',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('subject', sa.String(length=200), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
            sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('last_reply_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_tickets_user_id', 'support_tickets', ['user_id'])
        op.create_index('idx_tickets_status', 'support_tickets', ['status'])
        op.create_index('idx_tickets_priority', 'support_tickets', ['priority'])
        op.create_index('idx_tickets_category', 'support_tickets', ['category'])
        op.create_index('idx_tickets_created_at', 'support_tickets', ['created_at'])

    # Create ticket_messages table if it doesn't exist
    if 'ticket_messages' not in existing_tables:
        op.create_table(
            'ticket_messages',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('ticket_id', sa.Integer(), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('is_staff', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['ticket_id'], ['support_tickets.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_ticket_messages_ticket_id', 'ticket_messages', ['ticket_id'])
        op.create_index('idx_ticket_messages_user_id', 'ticket_messages', ['user_id'])
        op.create_index('idx_ticket_messages_created_at', 'ticket_messages', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_ticket_messages_created_at', table_name='ticket_messages')
    op.drop_index('idx_ticket_messages_user_id', table_name='ticket_messages')
    op.drop_index('idx_ticket_messages_ticket_id', table_name='ticket_messages')
    op.drop_table('ticket_messages')
    
    op.drop_index('idx_tickets_created_at', table_name='support_tickets')
    op.drop_index('idx_tickets_category', table_name='support_tickets')
    op.drop_index('idx_tickets_priority', table_name='support_tickets')
    op.drop_index('idx_tickets_status', table_name='support_tickets')
    op.drop_index('idx_tickets_user_id', table_name='support_tickets')
    op.drop_table('support_tickets')
    
    op.drop_index('idx_menus_user_id', table_name='menus')
    op.drop_index('idx_menus_location', table_name='menus')
    op.drop_index('idx_menus_name', table_name='menus')
    op.drop_table('menus')
    
    op.drop_index('idx_form_submissions_submitted_at', table_name='form_submissions')
    op.drop_index('idx_form_submissions_form_id', table_name='form_submissions')
    op.drop_table('form_submissions')
    
    op.drop_index('idx_forms_created_at', table_name='forms')
    op.drop_index('idx_forms_user_id', table_name='forms')
    op.drop_index('idx_forms_name', table_name='forms')
    op.drop_table('forms')
    
    op.drop_index('idx_pages_created_at', table_name='pages')
    op.drop_index('idx_pages_user_id', table_name='pages')
    op.drop_index('idx_pages_status', table_name='pages')
    op.drop_index('idx_pages_slug', table_name='pages')
    op.drop_table('pages')


