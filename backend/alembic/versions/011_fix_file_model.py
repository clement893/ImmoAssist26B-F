"""Fix file model structure

Revision ID: 011_fix_file_model
Revises: 010
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011_fix_file_model'
down_revision = '010_add_theme_preference'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if files table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    if 'files' not in inspector.get_table_names():
        # Create files table with correct structure
        op.create_table(
            'files',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('filename', sa.String(500), nullable=False),
            sa.Column('file_path', sa.String(1000), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('mime_type', sa.String(100), nullable=True),
            sa.Column('storage_type', sa.String(50), server_default='local', nullable=False),
            sa.Column('is_public', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
        )
        op.create_index('idx_files_user_id', 'files', ['user_id'])
        op.create_index('idx_files_created_at', 'files', ['created_at'])
        op.create_index('idx_files_storage_type', 'files', ['storage_type'])
        op.create_index('idx_files_is_public', 'files', ['is_public'])
    else:
        # Table exists, ensure it has correct structure
        columns = {col['name']: col for col in inspector.get_columns('files')}
        
        # Add missing columns if they don't exist
        if 'file_path' not in columns:
            op.add_column('files', sa.Column('file_path', sa.String(1000), nullable=True))
            # Migrate data from old column names if they exist
            if 'file_key' in columns:
                op.execute("UPDATE files SET file_path = file_key WHERE file_path IS NULL")
            op.alter_column('files', 'file_path', nullable=False)
        
        if 'file_size' not in columns:
            op.add_column('files', sa.Column('file_size', sa.Integer(), nullable=True))
            if 'size' in columns:
                op.execute("UPDATE files SET file_size = size WHERE file_size IS NULL")
            op.alter_column('files', 'file_size', nullable=False)
        
        if 'mime_type' not in columns:
            op.add_column('files', sa.Column('mime_type', sa.String(100), nullable=True))
            if 'content_type' in columns:
                op.execute("UPDATE files SET mime_type = content_type WHERE mime_type IS NULL")
        
        if 'storage_type' not in columns:
            op.add_column('files', sa.Column('storage_type', sa.String(50), server_default='local', nullable=False))
        
        if 'is_public' not in columns:
            op.add_column('files', sa.Column('is_public', sa.Boolean(), server_default='false', nullable=False))
        
        # Ensure timestamps are timezone-aware
        if 'created_at' in columns:
            try:
                op.alter_column('files', 'created_at', type_=sa.DateTime(timezone=True), existing_type=sa.DateTime, nullable=False)
            except:
                pass
        
        if 'updated_at' in columns:
            try:
                op.alter_column('files', 'updated_at', type_=sa.DateTime(timezone=True), existing_type=sa.DateTime, nullable=False)
            except:
                pass
        
        # Create indexes if missing
        indexes = {idx['name'] for idx in inspector.get_indexes('files')}
        if 'idx_files_storage_type' not in indexes:
            try:
                op.create_index('idx_files_storage_type', 'files', ['storage_type'])
            except:
                pass
        
        if 'idx_files_is_public' not in indexes:
            try:
                op.create_index('idx_files_is_public', 'files', ['is_public'])
            except:
                pass


def downgrade() -> None:
    # Keep old structure for rollback safety
    pass

