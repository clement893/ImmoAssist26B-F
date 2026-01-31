"""Create Léa AI conversations tables

Revision ID: 033_create_lea_conversations
Revises: 032_make_name_nullable
Create Date: 2026-01-31 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '033_create_lea_conversations'
down_revision: Union[str, None] = '032_make_name_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create lea_conversations table
    op.create_table(
        'lea_conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False),
        sa.Column('messages', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_lea_conversations_user_id', 'lea_conversations', ['user_id'], unique=False)
    op.create_index('idx_lea_conversations_session_id', 'lea_conversations', ['session_id'], unique=True)
    op.create_index('idx_lea_conversations_created_at', 'lea_conversations', ['created_at'], unique=False)

    # Create lea_tools_usage table
    op.create_table(
        'lea_tools_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('tool_name', sa.String(length=100), nullable=False),
        sa.Column('tool_input', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('tool_output', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('success', sa.String(length=20), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['lea_conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_lea_tools_usage_conversation_id', 'lea_tools_usage', ['conversation_id'], unique=False)
    op.create_index('idx_lea_tools_usage_tool_name', 'lea_tools_usage', ['tool_name'], unique=False)
    op.create_index('idx_lea_tools_usage_created_at', 'lea_tools_usage', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_lea_tools_usage_created_at', table_name='lea_tools_usage')
    op.drop_index('idx_lea_tools_usage_tool_name', table_name='lea_tools_usage')
    op.drop_index('idx_lea_tools_usage_conversation_id', table_name='lea_tools_usage')
    op.drop_table('lea_tools_usage')
    
    op.drop_index('idx_lea_conversations_created_at', table_name='lea_conversations')
    op.drop_index('idx_lea_conversations_session_id', table_name='lea_conversations')
    op.drop_index('idx_lea_conversations_user_id', table_name='lea_conversations')
    op.drop_table('lea_conversations')
