"""Create theme_fonts table

Revision ID: 018_create_theme_fonts
Revises: 017_ensure_template_theme
Create Date: 2025-01-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '018_create_theme_fonts'
down_revision = '017_ensure_template_theme'
branch_labels = None
depends_on = None


def upgrade():
    """Create theme_fonts table."""
    # Check if table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'theme_fonts' in tables:
        print("⚠️  theme_fonts table already exists, skipping creation")
        return
    
    # Create theme_fonts table
    op.create_table(
        'theme_fonts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('font_family', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_key', sa.String(length=500), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('url', sa.String(length=1000), nullable=False),
        sa.Column('font_format', sa.String(length=20), nullable=False),
        sa.Column('font_weight', sa.String(length=50), nullable=True),
        sa.Column('font_style', sa.String(length=50), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_theme_fonts_id', 'theme_fonts', ['id'])
    op.create_index('idx_theme_fonts_name', 'theme_fonts', ['name'])
    op.create_index('idx_theme_fonts_font_family', 'theme_fonts', ['font_family'])
    op.create_index('idx_theme_fonts_file_key', 'theme_fonts', ['file_key'], unique=True)
    op.create_index('idx_theme_fonts_created_by', 'theme_fonts', ['created_by'])
    op.create_index('idx_theme_fonts_created_at', 'theme_fonts', ['created_at'])


def downgrade():
    """Drop theme_fonts table."""
    # Drop indexes
    op.drop_index('idx_theme_fonts_created_at', table_name='theme_fonts')
    op.drop_index('idx_theme_fonts_created_by', table_name='theme_fonts')
    op.drop_index('idx_theme_fonts_file_key', table_name='theme_fonts')
    op.drop_index('idx_theme_fonts_font_family', table_name='theme_fonts')
    op.drop_index('idx_theme_fonts_name', table_name='theme_fonts')
    op.drop_index('idx_theme_fonts_id', table_name='theme_fonts')
    
    # Drop table
    op.drop_table('theme_fonts')

