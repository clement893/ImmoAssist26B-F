"""Create files table

Revision ID: 005_create_files_table
Revises: 004_add_oauth_fields
Create Date: 2025-12-21 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect, text

# revision identifiers, used by Alembic.
revision: str = '005_create_files_table'
down_revision: Union[str, None] = '004_add_oauth_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if files table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'files' in tables:
        return  # Table already exists, skip migration
    
    # Check the type of users.id to match the foreign key type
    users_columns = inspector.get_columns('users')
    users_id_type = None
    for col in users_columns:
        if col['name'] == 'id':
            users_id_type = str(col['type'])
            break
    
    # Determine user_id type based on users.id type
    if users_id_type and 'INTEGER' in users_id_type.upper():
        # Users table has INTEGER id, use INTEGER for user_id
        user_id_column = sa.Column('user_id', sa.Integer(), nullable=False)
    else:
        # Users table has UUID id (or unknown), use UUID for user_id
        user_id_column = sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False)
    
    # Create files table
    op.create_table(
        'files',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        user_id_column,
        sa.Column('file_key', sa.String(500), nullable=False, unique=True),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('content_type', sa.String(100), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('url', sa.String(1000), nullable=False),
        sa.Column('folder', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('idx_files_user_id', 'files', ['user_id'])
    op.create_index('idx_files_created_at', 'files', ['created_at'])
    op.create_index('idx_files_file_key', 'files', ['file_key'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_files_file_key', table_name='files')
    op.drop_index('idx_files_created_at', table_name='files')
    op.drop_index('idx_files_user_id', table_name='files')
    
    # Drop table
    op.drop_table('files')

